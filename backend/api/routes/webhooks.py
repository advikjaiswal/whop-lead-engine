from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
import stripe

from backend.database import get_db
from backend.config import STRIPE_WEBHOOK_SECRET
from backend.models.lead import Lead
from backend.models.revenue import Subscription
from backend.models.workspace import Workspace

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    try:
        payload = await request.body()
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=stripe_signature, secret=STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail=str(e))

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_session(session, db)
    else:
        print(f"Unhandled event type {event['type']}")

    return {"status": "success"}

def handle_checkout_session(session: dict, db: Session):
    """
    Handles a successful checkout session from Stripe.
    - Creates a Subscription record.
    - Updates the original Lead.
    - Calculates revenue share.
    """
    client_reference_id = session.get('client_reference_id')
    if not client_reference_id:
        print("Checkout session completed without a client_reference_id (attribution_id).")
        return

    # The client_reference_id should be our lead's attribution_id
    lead = db.query(Lead).filter(Lead.attribution_id == client_reference_id).first()
    if not lead:
        print(f"Could not find a lead with attribution_id: {client_reference_id}")
        return

    print(f"Processing successful conversion for lead: {lead.id}")

    # Get workspace to find the Stripe API key for fetching line items
    workspace = db.query(Workspace).filter(Workspace.creator_id == lead.user_id).first()
    if not workspace:
        print(f"Could not find workspace for creator {lead.user_id}")
        return
    
    stripe.api_key = workspace.stripe_secret_key
    
    try:
        line_items = stripe.checkout.Session.list_line_items(session['id'], limit=1)
        plan_id = line_items.data[0].price.id
        revenue = session.get('amount_total', 0) / 100.0 # Convert from cents
    except Exception as e:
        print(f"Could not fetch line items for session {session['id']}: {e}")
        plan_id = "unknown"
        revenue = 0

    # For now, let's assume a 10% engine cut
    engine_cut = revenue * 0.10
    creator_cut = revenue * 0.90

    # Create a new subscription record
    subscription = Subscription(
        stripe_subscription_id=session.get('subscription'),
        stripe_customer_id=session.get('customer'),
        plan_id=plan_id,
        revenue=revenue,
        attribution_id=client_reference_id,
        creator_id=lead.user_id,
        engine_cut=engine_cut,
        creator_cut=creator_cut
    )
    db.add(subscription)

    # Update the lead's status
    lead.status = "hot" # Or "converted"
    lead.outreach_stage = "converted"
    db.add(lead)

    db.commit()
    print(f"Successfully created subscription record for lead {lead.id}")
