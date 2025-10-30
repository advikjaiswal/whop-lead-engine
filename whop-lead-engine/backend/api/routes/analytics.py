from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from loguru import logger

from config.database import get_db
from models.user import User
from models.analytics import Analytics, RevenueTransaction
from models.lead import Lead, LeadStatus
from models.outreach import OutreachMessage, MessageStatus
from models.member import Member, ChurnRisk
from utils.auth import get_current_active_user

router = APIRouter()


class DashboardSummaryResponse(BaseModel):
    # Lead metrics
    total_leads: int
    leads_this_week: int
    leads_converted: int
    conversion_rate: float
    
    # Outreach metrics
    messages_sent: int
    messages_this_week: int
    response_rate: float
    
    # Retention metrics
    total_members: int
    at_risk_members: int
    members_retained_this_week: int
    retention_rate: float
    
    # Revenue metrics
    total_revenue: float
    revenue_this_week: float
    platform_fees: float
    client_revenue: float


class LeadAnalyticsResponse(BaseModel):
    total_leads: int
    leads_by_source: dict
    leads_by_status: dict
    conversion_funnel: dict
    quality_distribution: dict
    weekly_trends: List[dict]


class OutreachAnalyticsResponse(BaseModel):
    total_campaigns: int
    total_messages: int
    delivery_rate: float
    open_rate: float
    click_rate: float
    response_rate: float
    performance_by_campaign: List[dict]


class RetentionAnalyticsResponse(BaseModel):
    total_members: int
    churn_risk_distribution: dict
    retention_success_rate: float
    average_member_lifetime: float
    monthly_churn_rate: float
    activity_trends: List[dict]


class RevenueAnalyticsResponse(BaseModel):
    total_revenue: float
    monthly_recurring_revenue: float
    revenue_by_source: dict  # new_member, retention, upgrade
    platform_fees_total: float
    client_revenue_total: float
    revenue_trends: List[dict]
    top_revenue_months: List[dict]


@router.get("/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard summary statistics"""
    
    # Date ranges
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    # Lead metrics
    total_leads = db.query(Lead).filter(Lead.user_id == current_user.id).count()
    leads_this_week = db.query(Lead).filter(
        Lead.user_id == current_user.id,
        func.date(Lead.created_at) >= week_ago
    ).count()
    leads_converted = db.query(Lead).filter(
        Lead.user_id == current_user.id,
        Lead.status == LeadStatus.CONVERTED
    ).count()
    conversion_rate = (leads_converted / total_leads * 100) if total_leads > 0 else 0
    
    # Outreach metrics
    messages_sent = db.query(OutreachMessage).join(Lead).filter(
        Lead.user_id == current_user.id,
        OutreachMessage.status == MessageStatus.SENT
    ).count()
    messages_this_week = db.query(OutreachMessage).join(Lead).filter(
        Lead.user_id == current_user.id,
        OutreachMessage.status == MessageStatus.SENT,
        func.date(OutreachMessage.sent_at) >= week_ago
    ).count()
    
    messages_replied = db.query(OutreachMessage).join(Lead).filter(
        Lead.user_id == current_user.id,
        OutreachMessage.replied_at.isnot(None)
    ).count()
    response_rate = (messages_replied / messages_sent * 100) if messages_sent > 0 else 0
    
    # Retention metrics
    total_members = db.query(Member).filter(Member.user_id == current_user.id).count()
    at_risk_members = db.query(Member).filter(
        Member.user_id == current_user.id,
        Member.churn_risk.in_([ChurnRisk.HIGH, ChurnRisk.CRITICAL])
    ).count()
    
    # TODO: Implement retention tracking
    members_retained_this_week = 0
    retention_rate = 0
    
    # Revenue metrics
    revenue_data = db.query(func.sum(RevenueTransaction.gross_amount)).filter(
        RevenueTransaction.user_id == current_user.id
    ).scalar() or 0
    
    revenue_this_week = db.query(func.sum(RevenueTransaction.gross_amount)).filter(
        RevenueTransaction.user_id == current_user.id,
        func.date(RevenueTransaction.created_at) >= week_ago
    ).scalar() or 0
    
    platform_fees = db.query(func.sum(RevenueTransaction.platform_fee)).filter(
        RevenueTransaction.user_id == current_user.id
    ).scalar() or 0
    
    client_revenue = revenue_data - platform_fees
    
    return DashboardSummaryResponse(
        total_leads=total_leads,
        leads_this_week=leads_this_week,
        leads_converted=leads_converted,
        conversion_rate=round(conversion_rate, 2),
        messages_sent=messages_sent,
        messages_this_week=messages_this_week,
        response_rate=round(response_rate, 2),
        total_members=total_members,
        at_risk_members=at_risk_members,
        members_retained_this_week=members_retained_this_week,
        retention_rate=round(retention_rate, 2),
        total_revenue=round(revenue_data, 2),
        revenue_this_week=round(revenue_this_week, 2),
        platform_fees=round(platform_fees, 2),
        client_revenue=round(client_revenue, 2)
    )


@router.get("/leads", response_model=LeadAnalyticsResponse)
async def get_lead_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed lead analytics"""
    
    start_date = date.today() - timedelta(days=days)
    
    # Total leads
    total_leads = db.query(Lead).filter(Lead.user_id == current_user.id).count()
    
    # Leads by source
    leads_by_source = {}
    source_data = db.query(Lead.source, func.count(Lead.id)).filter(
        Lead.user_id == current_user.id
    ).group_by(Lead.source).all()
    
    for source, count in source_data:
        leads_by_source[source.value] = count
    
    # Leads by status
    leads_by_status = {}
    status_data = db.query(Lead.status, func.count(Lead.id)).filter(
        Lead.user_id == current_user.id
    ).group_by(Lead.status).all()
    
    for status, count in status_data:
        leads_by_status[status.value] = count
    
    # Conversion funnel
    conversion_funnel = {
        "new": leads_by_status.get("new", 0),
        "contacted": leads_by_status.get("contacted", 0),
        "responded": leads_by_status.get("responded", 0),
        "converted": leads_by_status.get("converted", 0)
    }
    
    # Quality distribution
    quality_data = db.query(Lead.quality_grade, func.count(Lead.id)).filter(
        Lead.user_id == current_user.id,
        Lead.quality_grade.isnot(None)
    ).group_by(Lead.quality_grade).all()
    
    quality_distribution = {}
    for grade, count in quality_data:
        quality_distribution[grade] = count
    
    # Weekly trends (last 8 weeks)
    weekly_trends = []
    for i in range(8):
        week_start = start_date + timedelta(weeks=i)
        week_end = week_start + timedelta(days=6)
        
        week_leads = db.query(func.count(Lead.id)).filter(
            Lead.user_id == current_user.id,
            func.date(Lead.created_at) >= week_start,
            func.date(Lead.created_at) <= week_end
        ).scalar() or 0
        
        weekly_trends.append({
            "week": week_start.isoformat(),
            "leads": week_leads
        })
    
    return LeadAnalyticsResponse(
        total_leads=total_leads,
        leads_by_source=leads_by_source,
        leads_by_status=leads_by_status,
        conversion_funnel=conversion_funnel,
        quality_distribution=quality_distribution,
        weekly_trends=weekly_trends
    )


@router.get("/outreach", response_model=OutreachAnalyticsResponse)
async def get_outreach_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get outreach analytics"""
    
    # Get all campaigns for user
    from models.outreach import OutreachCampaign
    campaigns = db.query(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id
    ).all()
    
    total_campaigns = len(campaigns)
    
    # Get all messages for user
    total_messages = db.query(OutreachMessage).join(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id
    ).count()
    
    # Calculate rates
    sent_messages = db.query(OutreachMessage).join(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id,
        OutreachMessage.status == MessageStatus.SENT
    ).count()
    
    delivered_messages = db.query(OutreachMessage).join(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id,
        OutreachMessage.delivered_at.isnot(None)
    ).count()
    
    opened_messages = db.query(OutreachMessage).join(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id,
        OutreachMessage.opened_at.isnot(None)
    ).count()
    
    clicked_messages = db.query(OutreachMessage).join(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id,
        OutreachMessage.clicked_at.isnot(None)
    ).count()
    
    replied_messages = db.query(OutreachMessage).join(OutreachCampaign).filter(
        OutreachCampaign.user_id == current_user.id,
        OutreachMessage.replied_at.isnot(None)
    ).count()
    
    delivery_rate = (delivered_messages / sent_messages * 100) if sent_messages > 0 else 0
    open_rate = (opened_messages / delivered_messages * 100) if delivered_messages > 0 else 0
    click_rate = (clicked_messages / opened_messages * 100) if opened_messages > 0 else 0
    response_rate = (replied_messages / sent_messages * 100) if sent_messages > 0 else 0
    
    # Performance by campaign
    performance_by_campaign = []
    for campaign in campaigns:
        campaign_messages = db.query(OutreachMessage).filter(
            OutreachMessage.campaign_id == campaign.id
        ).count()
        
        campaign_responses = db.query(OutreachMessage).filter(
            OutreachMessage.campaign_id == campaign.id,
            OutreachMessage.replied_at.isnot(None)
        ).count()
        
        campaign_response_rate = (campaign_responses / campaign_messages * 100) if campaign_messages > 0 else 0
        
        performance_by_campaign.append({
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "messages_sent": campaign_messages,
            "responses": campaign_responses,
            "response_rate": round(campaign_response_rate, 2)
        })
    
    return OutreachAnalyticsResponse(
        total_campaigns=total_campaigns,
        total_messages=total_messages,
        delivery_rate=round(delivery_rate, 2),
        open_rate=round(open_rate, 2),
        click_rate=round(click_rate, 2),
        response_rate=round(response_rate, 2),
        performance_by_campaign=performance_by_campaign
    )


@router.get("/retention", response_model=RetentionAnalyticsResponse)
async def get_retention_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get retention analytics"""
    
    total_members = db.query(Member).filter(Member.user_id == current_user.id).count()
    
    # Churn risk distribution
    risk_data = db.query(Member.churn_risk, func.count(Member.id)).filter(
        Member.user_id == current_user.id
    ).group_by(Member.churn_risk).all()
    
    churn_risk_distribution = {}
    for risk, count in risk_data:
        churn_risk_distribution[risk.value] = count
    
    # TODO: Implement proper retention tracking
    retention_success_rate = 0
    average_member_lifetime = 0
    monthly_churn_rate = 0
    
    # Activity trends (simplified)
    activity_trends = []
    for i in range(4):  # Last 4 weeks
        week_start = date.today() - timedelta(weeks=i+1)
        week_end = week_start + timedelta(days=6)
        
        active_members = db.query(func.count(Member.id)).filter(
            Member.user_id == current_user.id,
            Member.last_login >= week_start,
            Member.last_login <= week_end
        ).scalar() or 0
        
        activity_trends.append({
            "week": week_start.isoformat(),
            "active_members": active_members
        })
    
    return RetentionAnalyticsResponse(
        total_members=total_members,
        churn_risk_distribution=churn_risk_distribution,
        retention_success_rate=retention_success_rate,
        average_member_lifetime=average_member_lifetime,
        monthly_churn_rate=monthly_churn_rate,
        activity_trends=activity_trends
    )


@router.get("/revenue", response_model=RevenueAnalyticsResponse)
async def get_revenue_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get revenue analytics"""
    
    # Total revenue
    total_revenue = db.query(func.sum(RevenueTransaction.gross_amount)).filter(
        RevenueTransaction.user_id == current_user.id
    ).scalar() or 0
    
    # Monthly recurring revenue (estimate based on active members)
    mrr = db.query(func.sum(Member.monthly_revenue)).filter(
        Member.user_id == current_user.id,
        Member.status == "active"
    ).scalar() or 0
    
    # Revenue by source
    source_data = db.query(
        RevenueTransaction.transaction_type,
        func.sum(RevenueTransaction.gross_amount)
    ).filter(
        RevenueTransaction.user_id == current_user.id
    ).group_by(RevenueTransaction.transaction_type).all()
    
    revenue_by_source = {}
    for source, amount in source_data:
        revenue_by_source[source] = float(amount)
    
    # Platform fees and client revenue
    platform_fees_total = db.query(func.sum(RevenueTransaction.platform_fee)).filter(
        RevenueTransaction.user_id == current_user.id
    ).scalar() or 0
    
    client_revenue_total = total_revenue - platform_fees_total
    
    # Revenue trends (last 6 months)
    revenue_trends = []
    for i in range(6):
        month_start = date.today().replace(day=1) - timedelta(days=i*30)
        month_end = month_start + timedelta(days=30)
        
        month_revenue = db.query(func.sum(RevenueTransaction.gross_amount)).filter(
            RevenueTransaction.user_id == current_user.id,
            func.date(RevenueTransaction.created_at) >= month_start,
            func.date(RevenueTransaction.created_at) < month_end
        ).scalar() or 0
        
        revenue_trends.append({
            "month": month_start.strftime("%Y-%m"),
            "revenue": float(month_revenue)
        })
    
    # Top revenue months
    top_months = db.query(
        func.date_trunc('month', RevenueTransaction.created_at),
        func.sum(RevenueTransaction.gross_amount)
    ).filter(
        RevenueTransaction.user_id == current_user.id
    ).group_by(
        func.date_trunc('month', RevenueTransaction.created_at)
    ).order_by(
        func.sum(RevenueTransaction.gross_amount).desc()
    ).limit(5).all()
    
    top_revenue_months = []
    for month, amount in top_months:
        top_revenue_months.append({
            "month": month.strftime("%Y-%m"),
            "revenue": float(amount)
        })
    
    return RevenueAnalyticsResponse(
        total_revenue=round(total_revenue, 2),
        monthly_recurring_revenue=round(mrr, 2),
        revenue_by_source=revenue_by_source,
        platform_fees_total=round(platform_fees_total, 2),
        client_revenue_total=round(client_revenue_total, 2),
        revenue_trends=revenue_trends,
        top_revenue_months=top_revenue_months
    )