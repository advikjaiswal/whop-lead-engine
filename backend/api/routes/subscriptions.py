from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import stripe
from loguru import logger
from pydantic import BaseModel
from typing import Optional

from config.database import get_db
from utils.auth import get_current_active_user
from config.settings import get_settings
from models.user import User
from models.member import Member

router = APIRouter()
settings = get_settings()

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateSubscriptionRequest(BaseModel):
    price_id: str
    customer_email: str
    customer_name: Optional[str] = None
    payment_method_id: Optional[str] = None
    success_url: str
    cancel_url: str

@router.post("/create")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a subscription with revenue share"""
    
    if not current_user.stripe_account_id:
        raise HTTPException(status_code=400, detail="Stripe account not connected")
        
    try:
        # 1. Create/Get Customer on the connected account
        # We need to use the connected account's credentials or act on their behalf
        # For Standard accounts, we use the platform key but specify stripe_account header,
        # OR use the user's access_token.
        # Using stripe_account header is cleaner for Direct Charges if we have the ID.
        # But for Standard, we usually use the access_token as the API key.
        
        # Let's use the access_token if we have it, otherwise try stripe_account header
        request_kwargs = {}
        if current_user.stripe_access_token:
            request_kwargs['api_key'] = current_user.stripe_access_token
        else:
            # Fallback (might not work for Standard without platform controls)
            request_kwargs['stripe_account'] = current_user.stripe_account_id
            
        # Create Customer
        customers = stripe.Customer.list(
            email=request.customer_email,
            limit=1,
            **request_kwargs
        )
        
        if customers.data:
            customer = customers.data[0]
        else:
            customer = stripe.Customer.create(
                email=request.customer_email,
                name=request.customer_name,
                payment_method=request.payment_method_id,
                invoice_settings={"default_payment_method": request.payment_method_id} if request.payment_method_id else None,
                **request_kwargs
            )
            
        # 2. Create Subscription with Application Fee
        # Calculate fee (25%)
        # We need the price amount to calculate the fee amount if we use application_fee_amount
        # Or we can use application_fee_percent if supported.
        # application_fee_percent is deprecated for some flows but still works for many.
        # However, to be precise, let's fetch the price first.
        
        price = stripe.Price.retrieve(request.price_id, **request_kwargs)
        amount = price.unit_amount
        
        # Calculate 25% fee
        fee_amount = int(amount * 0.25)
        
        # Create Subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": request.price_id}],
            application_fee_percent=25, # Using percent is easier if supported, otherwise use amount
            # application_fee_amount=fee_amount, # Alternative
            expand=["latest_invoice.payment_intent"],
            **request_kwargs
        )
        
        logger.info(f"Created subscription {subscription.id} for user {current_user.id} with 25% fee")
        
        return {
            "subscriptionId": subscription.id,
            "clientSecret": subscription.latest_invoice.payment_intent.client_secret if subscription.latest_invoice and subscription.latest_invoice.payment_intent else None,
            "customerId": customer.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating subscription: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/checkout-session")
async def create_checkout_session(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a Checkout Session with revenue share"""
    
    if not current_user.stripe_account_id:
        raise HTTPException(status_code=400, detail="Stripe account not connected")
        
    try:
        request_kwargs = {}
        if current_user.stripe_access_token:
            request_kwargs['api_key'] = current_user.stripe_access_token
        else:
            request_kwargs['stripe_account'] = current_user.stripe_account_id
            
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': request.price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=request.customer_email,
            subscription_data={
                'application_fee_percent': 25,
            },
            **request_kwargs
        )
        
        return {"url": session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe Checkout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
