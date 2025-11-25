import uuid

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from backend.database import get_db
from backend.models.user import User
from backend.models.lead import Lead
from backend.schemas.leads import LeadDiscoveryRequest, LeadResponse
from backend.services.auth_service import get_current_user
from backend.services.lead_service import discover_reddit_leads
from backend.services.messaging_service import send_welcome_dm

router = APIRouter()

@router.post("/discover")
async def discover_leads(
    request: LeadDiscoveryRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not request.keywords or len(request.keywords) == 0:
        raise HTTPException(status_code=400, detail="At least one keyword is required")
    
    # ... (rest of the validation)

    try:
        discovered_leads = await discover_reddit_leads(
            keywords=[kw.strip() for kw in request.keywords if kw.strip()][:10],
            subreddits=[sub.strip().lower() for sub in request.subreddits if sub.strip()][:10],
            max_leads=min(request.max_leads or 10, 50)
        )
        
        if not discovered_leads:
            return []
        
        if current_user.id != 999999:  # Not demo user
            saved_leads = []
            for lead_data in discovered_leads:
                db_lead = Lead(
                    user_id=current_user.id,
                    attribution_id=f"lead_{uuid.uuid4()}", # Generate unique attribution ID
                    **lead_data
                )
                db.add(db_lead)
                db.commit()
                db.refresh(db_lead)
                saved_leads.append(db_lead)
                
                background_tasks.add_task(send_welcome_dm, db, db_lead)

            return [LeadResponse.from_orm(lead) for lead in saved_leads]
        
        # For demo users, just return the data without saving or sending DMs
        return [
            LeadResponse(
                id=i + 1,
                discovered_at=datetime.utcnow(),
                status="cold",
                outreach_stage="pending",
                **lead_data
            )
            for i, lead_data in enumerate(discovered_leads)
        ]
        
    except Exception as e:
        print(f"Lead discovery error: {e}")
        raise HTTPException(status_code=500, detail="Failed to discover leads. Please try again.")

@router.get("/", response_model=List[LeadResponse])
async def get_user_leads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    leads = db.query(Lead).filter(Lead.user_id == current_user.id).order_by(Lead.discovered_at.desc()).all()
    return [LeadResponse.from_orm(lead) for lead in leads]

@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.user_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    db.delete(lead)
    db.commit()
    return

