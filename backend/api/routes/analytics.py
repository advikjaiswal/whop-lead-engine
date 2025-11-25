from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from backend.database import get_db
from backend.models.user import User
from backend.models.lead import Lead, LeadStatus
from backend.models.revenue import Subscription
from backend.services.auth_service import get_current_user

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Define time range for "new"
    time_range = datetime.utcnow() - timedelta(days=30) # Last 30 days

    new_leads_captured = db.query(Lead).filter(
        Lead.creator_id == current_user.id,
        Lead.discovered_at >= time_range
    ).count()

    warm_leads = db.query(Lead).filter(
        Lead.creator_id == current_user.id,
        Lead.status == LeadStatus.WARM
    ).count()

    paid_members_added = db.query(Subscription).filter(
        Subscription.creator_id == current_user.id,
        Subscription.timestamp >= time_range
    ).count()

    revenue_generated = db.query(func.sum(Subscription.revenue)).filter(
        Subscription.creator_id == current_user.id,
        Subscription.timestamp >= time_range
    ).scalar() or 0

    return {
        "new_leads_captured": new_leads_captured,
        "outreach_messages_sent": 0, # Placeholder
        "warm_leads": warm_leads,
        "paid_members_added": paid_members_added,
        "revenue_generated": revenue_generated
    }


@router.get("/retention")
async def get_retention_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get retention analytics data"""
    from backend.models.member import Member, ChurnRisk
    
    # Get all members for user
    members = db.query(Member).filter(Member.user_id == current_user.id).all()
    
    total_members = len(members)
    
    # Calculate risk distribution
    risk_dist = {
        "high": len([m for m in members if m.churn_risk in [ChurnRisk.HIGH, ChurnRisk.CRITICAL]]),
        "medium": len([m for m in members if m.churn_risk == ChurnRisk.MEDIUM]),
        "low": len([m for m in members if m.churn_risk == ChurnRisk.LOW])
    }
    
    # Calculate retention rate (simple version: 1 - (churned / total))
    churned_count = len([m for m in members if m.status == 'churned'])
    retention_rate = 100.0
    if total_members > 0:
        retention_rate = ((total_members - churned_count) / total_members) * 100
        
    # Mock activity trends for now (last 4 weeks)
    # In a real app, this would query historical activity logs
    activity_trends = []
    for i in range(4):
        date = datetime.utcnow() - timedelta(weeks=3-i)
        activity_trends.append({
            "week": date.isoformat(),
            "active_members": int(total_members * (0.8 + (i * 0.05))) # Mock trend
        })
        
    return {
        "total_members": total_members,
        "churn_risk_distribution": risk_dist,
        "retention_success_rate": retention_rate,
        "activity_trends": activity_trends
    }

