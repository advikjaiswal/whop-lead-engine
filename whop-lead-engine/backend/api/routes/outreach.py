from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json
from loguru import logger

from config.database import get_db
from models.user import User
from models.outreach import OutreachCampaign, OutreachMessage, CampaignStatus, MessageStatus
from models.lead import Lead
from utils.auth import get_current_active_user
from utils.exceptions import NotFoundError, ValidationError
from services.ai_service import AIService
from services.email_service import EmailService

router = APIRouter()


class OutreachCampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    subject_template: Optional[str] = None
    message_template: str
    personalization_enabled: bool = True


class OutreachCampaignResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: CampaignStatus
    subject_template: Optional[str] = None
    message_template: str
    personalization_enabled: bool
    total_leads: int
    messages_sent: int
    responses_received: int
    conversions: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OutreachMessageResponse(BaseModel):
    id: int
    campaign_id: int
    lead_id: int
    subject: Optional[str] = None
    content: str
    status: MessageStatus
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class SendCampaignRequest(BaseModel):
    lead_ids: List[int]


@router.post("/campaigns", response_model=OutreachCampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_data: OutreachCampaignCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new outreach campaign"""
    
    campaign = OutreachCampaign(
        user_id=current_user.id,
        name=campaign_data.name,
        description=campaign_data.description,
        subject_template=campaign_data.subject_template,
        message_template=campaign_data.message_template,
        personalization_enabled=campaign_data.personalization_enabled
    )
    
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    logger.info(f"Created campaign {campaign.id} for user {current_user.id}")
    
    return OutreachCampaignResponse.from_orm(campaign)


@router.get("/campaigns", response_model=List[OutreachCampaignResponse])
async def get_campaigns(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's outreach campaigns"""
    
    campaigns = db.query(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id
    ).all()
    
    return [OutreachCampaignResponse.from_orm(campaign) for campaign in campaigns]


@router.get("/campaigns/{campaign_id}", response_model=OutreachCampaignResponse)
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific campaign"""
    
    campaign = db.query(OutreachCampaign).filter(
        OutreachCampaign.id == campaign_id,
        OutreachCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise NotFoundError("Campaign not found")
    
    return OutreachCampaignResponse.from_orm(campaign)


@router.post("/campaigns/{campaign_id}/send")
async def send_campaign(
    campaign_id: int,
    send_request: SendCampaignRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send outreach messages for a campaign"""
    
    campaign = db.query(OutreachCampaign).filter(
        OutreachCampaign.id == campaign_id,
        OutreachCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise NotFoundError("Campaign not found")
    
    # Get leads
    leads = db.query(Lead).filter(
        Lead.id.in_(send_request.lead_ids),
        Lead.user_id == current_user.id
    ).all()
    
    if len(leads) != len(send_request.lead_ids):
        raise ValidationError("Some leads not found or don't belong to user")
    
    ai_service = AIService()
    email_service = EmailService()
    
    messages_created = 0
    messages_sent = 0
    
    for lead in leads:
        try:
            # Check if message already exists for this campaign and lead
            existing_message = db.query(OutreachMessage).filter(
                OutreachMessage.campaign_id == campaign_id,
                OutreachMessage.lead_id == lead.id
            ).first()
            
            if existing_message:
                continue
            
            # Generate personalized content
            subject = campaign.subject_template or f"Invitation to {current_user.whop_community_name or 'our community'}"
            content = campaign.message_template
            
            if campaign.personalization_enabled and lead.personalization_data:
                try:
                    personalization_data = json.loads(lead.personalization_data) if lead.personalization_data else {}
                    personalized_content = await ai_service.personalize_message(
                        template=campaign.message_template,
                        lead_data={
                            "name": lead.name,
                            "username": lead.username,
                            "interests": json.loads(lead.interests) if lead.interests else [],
                            "pain_points": json.loads(lead.pain_points) if lead.pain_points else [],
                            **personalization_data
                        }
                    )
                    content = personalized_content
                except Exception as e:
                    logger.error(f"Failed to personalize message for lead {lead.id}: {e}")
            
            # Create message record
            message = OutreachMessage(
                campaign_id=campaign_id,
                lead_id=lead.id,
                subject=subject,
                content=content,
                personalized_content=content if campaign.personalization_enabled else None,
                status=MessageStatus.QUEUED
            )
            
            db.add(message)
            db.commit()
            db.refresh(message)
            
            messages_created += 1
            
            # Send message if lead has email
            if lead.email:
                try:
                    external_id = await email_service.send_email(
                        to_email=lead.email,
                        subject=subject,
                        content=content
                    )
                    
                    message.external_message_id = external_id
                    message.status = MessageStatus.SENT
                    message.sent_at = datetime.utcnow()
                    
                    # Update lead
                    lead.last_contacted = datetime.utcnow()
                    lead.contact_count += 1
                    
                    messages_sent += 1
                    
                except Exception as e:
                    message.status = MessageStatus.FAILED
                    message.error_message = str(e)
                    logger.error(f"Failed to send message {message.id}: {e}")
            else:
                message.status = MessageStatus.FAILED
                message.error_message = "No email address available"
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to process lead {lead.id} for campaign {campaign_id}: {e}")
    
    # Update campaign metrics
    campaign.total_leads = len(send_request.lead_ids)
    campaign.messages_sent += messages_sent
    if campaign.status == CampaignStatus.DRAFT:
        campaign.status = CampaignStatus.ACTIVE
        campaign.started_at = datetime.utcnow()
    
    db.commit()
    
    logger.info(f"Campaign {campaign_id}: Created {messages_created} messages, sent {messages_sent}")
    
    return {
        "message": f"Campaign processed. Created {messages_created} messages, sent {messages_sent}",
        "messages_created": messages_created,
        "messages_sent": messages_sent
    }


@router.get("/campaigns/{campaign_id}/messages", response_model=List[OutreachMessageResponse])
async def get_campaign_messages(
    campaign_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get messages for a campaign"""
    
    # Verify campaign ownership
    campaign = db.query(OutreachCampaign).filter(
        OutreachCampaign.id == campaign_id,
        OutreachCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise NotFoundError("Campaign not found")
    
    messages = db.query(OutreachMessage).filter(
        OutreachMessage.campaign_id == campaign_id
    ).all()
    
    return [OutreachMessageResponse.from_orm(message) for message in messages]


@router.post("/messages/{message_id}/track")
async def track_message_event(
    message_id: int,
    event_type: str,  # opened, clicked, replied
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track message events (opens, clicks, replies)"""
    
    # Find message through campaign ownership
    message = db.query(OutreachMessage).join(OutreachCampaign).filter(
        OutreachMessage.id == message_id,
        OutreachCampaign.user_id == current_user.id
    ).first()
    
    if not message:
        raise NotFoundError("Message not found")
    
    now = datetime.utcnow()
    
    if event_type == "opened" and not message.opened_at:
        message.opened_at = now
    elif event_type == "clicked" and not message.clicked_at:
        message.clicked_at = now
    elif event_type == "replied" and not message.replied_at:
        message.replied_at = now
        # Update campaign metrics
        campaign = message.campaign
        campaign.responses_received += 1
    
    db.commit()
    
    return {"message": f"Event '{event_type}' tracked successfully"}