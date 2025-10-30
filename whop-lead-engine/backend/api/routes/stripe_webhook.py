from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import stripe
import json
from loguru import logger
from datetime import datetime

from config.database import get_db
from utils.auth import get_current_active_user
from config.settings import get_settings
from models.user import User
from models.member import Member
from models.analytics import RevenueTransaction

router = APIRouter()
settings = get_settings()

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events"""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        await handle_payment_succeeded(event['data']['object'], db)
    elif event['type'] == 'invoice.payment_succeeded':
        await handle_subscription_payment(event['data']['object'], db)
    elif event['type'] == 'customer.subscription.created':
        await handle_subscription_created(event['data']['object'], db)
    elif event['type'] == 'customer.subscription.updated':
        await handle_subscription_updated(event['data']['object'], db)
    elif event['type'] == 'customer.subscription.deleted':
        await handle_subscription_cancelled(event['data']['object'], db)
    else:
        logger.info(f"Unhandled event type: {event['type']}")
    
    return {"status": "success"}


async def handle_payment_succeeded(payment_intent, db: Session):
    """Handle successful payment"""
    
    logger.info(f"Payment succeeded: {payment_intent['id']}")
    
    # Extract metadata to identify the user and transaction type
    metadata = payment_intent.get('metadata', {})
    user_id = metadata.get('user_id')
    transaction_type = metadata.get('transaction_type', 'new_member')
    member_id = metadata.get('member_id')
    
    if not user_id:
        logger.warning(f"No user_id in payment metadata: {payment_intent['id']}")
        return
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User not found: {user_id}")
        return
    
    # Calculate fees
    gross_amount = payment_intent['amount'] / 100  # Convert from cents
    platform_fee_percentage = settings.PLATFORM_REVENUE_SHARE
    platform_fee = gross_amount * platform_fee_percentage
    client_amount = gross_amount - platform_fee
    
    # Create revenue transaction
    transaction = RevenueTransaction(
        user_id=user_id,
        stripe_payment_intent_id=payment_intent['id'],
        member_id=member_id,
        gross_amount=gross_amount,
        platform_fee=platform_fee,
        client_amount=client_amount,
        platform_fee_percentage=platform_fee_percentage,
        transaction_type=transaction_type,
        description=f"Payment for {transaction_type}",
        status="completed",
        processed_at=datetime.utcnow()
    )
    
    db.add(transaction)
    
    # Update member if applicable
    if member_id:
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.user_id == user_id
        ).first()
        
        if member and transaction_type == "retention":
            member.retention_successful = True
            member.churned_at = None
            logger.info(f"Member {member_id} successfully retained")
    
    db.commit()
    
    logger.info(f"Revenue transaction created: {transaction.id} - ${gross_amount}")


async def handle_subscription_payment(invoice, db: Session):
    """Handle recurring subscription payment"""
    
    logger.info(f"Subscription payment: {invoice['id']}")
    
    subscription_id = invoice['subscription']
    customer_id = invoice['customer']
    
    # Try to find the member by subscription_id
    member = db.query(Member).filter(
        Member.subscription_id == subscription_id
    ).first()
    
    if not member:
        logger.warning(f"Member not found for subscription: {subscription_id}")
        return
    
    # Calculate fees
    gross_amount = invoice['amount_paid'] / 100  # Convert from cents
    platform_fee_percentage = settings.PLATFORM_REVENUE_SHARE
    platform_fee = gross_amount * platform_fee_percentage
    client_amount = gross_amount - platform_fee
    
    # Create revenue transaction
    transaction = RevenueTransaction(
        user_id=member.user_id,
        stripe_subscription_id=subscription_id,
        member_id=member.id,
        gross_amount=gross_amount,
        platform_fee=platform_fee,
        client_amount=client_amount,
        platform_fee_percentage=platform_fee_percentage,
        transaction_type="subscription",
        description=f"Subscription payment for member {member.id}",
        status="completed",
        processed_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.commit()
    
    logger.info(f"Subscription revenue tracked: {transaction.id} - ${gross_amount}")


async def handle_subscription_created(subscription, db: Session):
    """Handle new subscription creation"""
    
    logger.info(f"Subscription created: {subscription['id']}")
    
    # Extract metadata to identify the member
    metadata = subscription.get('metadata', {})
    member_id = metadata.get('member_id')
    
    if member_id:
        member = db.query(Member).filter(Member.id == member_id).first()
        if member:
            member.subscription_id = subscription['id']
            db.commit()
            logger.info(f"Subscription ID updated for member {member_id}")


async def handle_subscription_updated(subscription, db: Session):
    """Handle subscription updates"""
    
    logger.info(f"Subscription updated: {subscription['id']}")
    
    member = db.query(Member).filter(
        Member.subscription_id == subscription['id']
    ).first()
    
    if member:
        # Update member tier if it changed
        if 'metadata' in subscription and 'tier' in subscription['metadata']:
            member.tier = subscription['metadata']['tier']
        
        # Update monthly revenue based on subscription amount
        if subscription['items']['data']:
            item = subscription['items']['data'][0]
            member.monthly_revenue = item['price']['unit_amount'] / 100
        
        db.commit()
        logger.info(f"Member {member.id} subscription updated")


async def handle_subscription_cancelled(subscription, db: Session):
    """Handle subscription cancellation"""
    
    logger.info(f"Subscription cancelled: {subscription['id']}")
    
    member = db.query(Member).filter(
        Member.subscription_id == subscription['id']
    ).first()
    
    if member:
        member.status = "churned"
        member.churned_at = datetime.utcnow()
        member.subscription_id = None
        
        db.commit()
        logger.info(f"Member {member.id} marked as churned")


@router.post("/connect/onboarding")
async def create_connect_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create Stripe Connect account for user"""
    
    try:
        # Create connected account
        account = stripe.Account.create(
            type="express",
            country="US",  # TODO: Make this configurable
            email=current_user.email,
            business_type="individual",
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
        )
        
        # Save account ID
        current_user.stripe_account_id = account.id
        db.commit()
        
        # Create onboarding link
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"{settings.FRONTEND_URL}/settings?stripe_refresh=true",
            return_url=f"{settings.FRONTEND_URL}/settings?stripe_success=true",
            type="account_onboarding",
        )
        
        logger.info(f"Stripe Connect account created for user {current_user.id}: {account.id}")
        
        return {
            "account_id": account.id,
            "onboarding_url": account_link.url
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe Connect error for user {current_user.id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/connect/status")
async def get_connect_status(
    current_user: User = Depends(get_current_active_user)
):
    """Get Stripe Connect account status"""
    
    if not current_user.stripe_account_id:
        return {
            "connected": False,
            "onboarding_complete": False
        }
    
    try:
        account = stripe.Account.retrieve(current_user.stripe_account_id)
        
        onboarding_complete = (
            account.charges_enabled and
            account.payouts_enabled and
            not account.requirements.currently_due
        )
        
        return {
            "connected": True,
            "onboarding_complete": onboarding_complete,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "requirements": account.requirements.currently_due
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error retrieving Stripe account for user {current_user.id}: {e}")
        return {
            "connected": False,
            "onboarding_complete": False,
            "error": str(e)
        }