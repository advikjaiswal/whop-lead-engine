from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import json
from loguru import logger

from config.database import get_db
from models.user import User
from models.member import Member, RetentionMessage, MemberStatus, ChurnRisk
from utils.auth import get_current_active_user
from utils.exceptions import NotFoundError, ValidationError
from services.whop_service import WhopService
from services.ai_service import AIService
from services.email_service import EmailService

router = APIRouter()


class MemberResponse(BaseModel):
    id: int
    whop_member_id: str
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    status: MemberStatus
    tier: Optional[str] = None
    monthly_revenue: Optional[float] = None
    last_login: Optional[datetime] = None
    last_message: Optional[datetime] = None
    total_messages: int
    activity_score: float
    churn_risk: ChurnRisk
    churn_score: float
    days_inactive: int
    retention_messages_sent: int
    last_retention_contact: Optional[datetime] = None
    joined_at: datetime
    churned_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RetentionMessageResponse(BaseModel):
    id: int
    member_id: int
    message_type: str
    subject: Optional[str] = None
    content: str
    sent_at: datetime
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    member_returned: Optional[bool] = None
    return_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ChurnPredictionResponse(BaseModel):
    total_members: int
    at_risk_members: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    predictions: List[MemberResponse]


class SendRetentionMessageRequest(BaseModel):
    member_ids: List[int]
    message_type: str  # reminder, coupon, personal_check_in
    custom_message: Optional[str] = None


@router.get("/", response_model=List[MemberResponse])
async def get_members(
    status: Optional[MemberStatus] = None,
    churn_risk: Optional[ChurnRisk] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's community members"""
    
    query = db.query(Member).filter(Member.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.filter(Member.status == status)
    if churn_risk:
        query = query.filter(Member.churn_risk == churn_risk)
    
    members = query.all()
    
    return [MemberResponse.from_orm(member) for member in members]


@router.post("/sync")
async def sync_members_from_whop(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Sync members from Whop API"""
    
    if not current_user.whop_api_key:
        raise ValidationError("Whop API key not configured")
    
    whop_service = WhopService(current_user.whop_api_key)
    
    try:
        # Fetch members from Whop API
        whop_members = await whop_service.get_community_members(current_user.whop_community_id)
        
        synced_count = 0
        updated_count = 0
        
        for whop_member in whop_members:
            # Check if member already exists
            existing_member = db.query(Member).filter(
                Member.user_id == current_user.id,
                Member.whop_member_id == whop_member['id']
            ).first()
            
            if existing_member:
                # Update existing member
                existing_member.email = whop_member.get('email')
                existing_member.username = whop_member.get('username')
                existing_member.full_name = whop_member.get('full_name')
                existing_member.status = MemberStatus(whop_member.get('status', 'active'))
                existing_member.tier = whop_member.get('tier')
                existing_member.monthly_revenue = whop_member.get('monthly_revenue')
                existing_member.last_login = whop_member.get('last_login')
                existing_member.last_message = whop_member.get('last_message')
                existing_member.total_messages = whop_member.get('total_messages', 0)
                
                updated_count += 1
            else:
                # Create new member
                member = Member(
                    user_id=current_user.id,
                    whop_member_id=whop_member['id'],
                    email=whop_member.get('email'),
                    username=whop_member.get('username'),
                    full_name=whop_member.get('full_name'),
                    status=MemberStatus(whop_member.get('status', 'active')),
                    tier=whop_member.get('tier'),
                    monthly_revenue=whop_member.get('monthly_revenue'),
                    last_login=whop_member.get('last_login'),
                    last_message=whop_member.get('last_message'),
                    total_messages=whop_member.get('total_messages', 0),
                    joined_at=whop_member.get('joined_at', datetime.utcnow())
                )
                
                db.add(member)
                synced_count += 1
        
        db.commit()
        
        # Update churn predictions for all members
        await update_churn_predictions(current_user.id, db)
        
        logger.info(f"Synced {synced_count} new members, updated {updated_count} for user {current_user.id}")
        
        return {
            "message": "Members synced successfully",
            "new_members": synced_count,
            "updated_members": updated_count
        }
        
    except Exception as e:
        logger.error(f"Failed to sync members for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync members from Whop")


@router.get("/churn-prediction", response_model=ChurnPredictionResponse)
async def get_churn_prediction(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get churn prediction analysis"""
    
    # Update churn predictions
    await update_churn_predictions(current_user.id, db)
    
    # Get all members
    members = db.query(Member).filter(Member.user_id == current_user.id).all()
    
    # Calculate statistics
    total_members = len(members)
    high_risk = [m for m in members if m.churn_risk == ChurnRisk.HIGH or m.churn_risk == ChurnRisk.CRITICAL]
    medium_risk = [m for m in members if m.churn_risk == ChurnRisk.MEDIUM]
    low_risk = [m for m in members if m.churn_risk == ChurnRisk.LOW]
    
    at_risk_members = len([m for m in members if m.churn_risk in [ChurnRisk.HIGH, ChurnRisk.CRITICAL]])
    
    return ChurnPredictionResponse(
        total_members=total_members,
        at_risk_members=at_risk_members,
        high_risk_count=len(high_risk),
        medium_risk_count=len(medium_risk),
        low_risk_count=len(low_risk),
        predictions=[MemberResponse.from_orm(member) for member in members]
    )


@router.post("/retention/send")
async def send_retention_messages(
    request: SendRetentionMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send retention messages to at-risk members"""
    
    # Get members
    members = db.query(Member).filter(
        Member.id.in_(request.member_ids),
        Member.user_id == current_user.id
    ).all()
    
    if len(members) != len(request.member_ids):
        raise ValidationError("Some members not found or don't belong to user")
    
    ai_service = AIService()
    email_service = EmailService()
    
    messages_sent = 0
    
    for member in members:
        try:
            # Generate retention message
            if request.custom_message:
                content = request.custom_message
            else:
                content = await ai_service.generate_retention_message(
                    member_data={
                        "name": member.full_name or member.username,
                        "days_inactive": member.days_inactive,
                        "tier": member.tier,
                        "message_type": request.message_type
                    },
                    community_name=current_user.whop_community_name
                )
            
            # Create retention message record
            retention_message = RetentionMessage(
                member_id=member.id,
                message_type=request.message_type,
                subject=f"We miss you in {current_user.whop_community_name or 'our community'}!",
                content=content,
                sent_at=datetime.utcnow()
            )
            
            db.add(retention_message)
            
            # Send email if available
            if member.email:
                try:
                    external_id = await email_service.send_email(
                        to_email=member.email,
                        subject=retention_message.subject,
                        content=content
                    )
                    
                    retention_message.external_message_id = external_id
                    
                    # Update member
                    member.retention_messages_sent += 1
                    member.last_retention_contact = datetime.utcnow()
                    
                    messages_sent += 1
                    
                except Exception as e:
                    logger.error(f"Failed to send retention message to member {member.id}: {e}")
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to process retention message for member {member.id}: {e}")
    
    logger.info(f"Sent {messages_sent} retention messages for user {current_user.id}")
    
    return {
        "message": f"Sent {messages_sent} retention messages",
        "messages_sent": messages_sent
    }


@router.get("/retention/messages", response_model=List[RetentionMessageResponse])
async def get_retention_messages(
    member_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get retention messages"""
    
    query = db.query(RetentionMessage).join(Member).filter(
        Member.user_id == current_user.id
    )
    
    if member_id:
        query = query.filter(RetentionMessage.member_id == member_id)
    
    messages = query.all()
    
    return [RetentionMessageResponse.from_orm(message) for message in messages]


async def update_churn_predictions(user_id: int, db: Session):
    """Update churn predictions for all members"""
    
    members = db.query(Member).filter(Member.user_id == user_id).all()
    
    for member in members:
        # Calculate days inactive
        if member.last_login:
            member.days_inactive = (datetime.utcnow() - member.last_login).days
        elif member.last_message:
            member.days_inactive = (datetime.utcnow() - member.last_message).days
        else:
            member.days_inactive = (datetime.utcnow() - member.joined_at).days
        
        # Simple churn prediction logic
        if member.days_inactive >= 30:
            member.churn_risk = ChurnRisk.CRITICAL
            member.churn_score = 0.9
        elif member.days_inactive >= 14:
            member.churn_risk = ChurnRisk.HIGH
            member.churn_score = 0.7
        elif member.days_inactive >= 7:
            member.churn_risk = ChurnRisk.MEDIUM
            member.churn_score = 0.4
        else:
            member.churn_risk = ChurnRisk.LOW
            member.churn_score = 0.1
        
        # Calculate activity score (0-100)
        base_score = 100
        base_score -= member.days_inactive * 2  # -2 points per day inactive
        base_score += member.total_messages * 0.1  # +0.1 points per message
        
        member.activity_score = max(0, min(100, base_score))
    
    db.commit()