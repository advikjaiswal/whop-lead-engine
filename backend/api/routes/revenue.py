from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from backend.database import get_db
from backend.models.user import User
from backend.models.revenue import Subscription
from backend.services.auth_service import get_current_user
from pydantic import BaseModel

class RevenueStats(BaseModel):
    total_revenue: float
    total_engine_cut: float
    total_creator_cut: float
    total_subscriptions: int

class SubscriptionResponse(BaseModel):
    id: int
    revenue: float
    creator_cut: float
    timestamp: str

    class Config:
        from_attributes = True

class RevenueData(BaseModel):
    stats: RevenueStats
    subscriptions: List[SubscriptionResponse]


router = APIRouter()

@router.get("/", response_model=RevenueData)
def get_revenue_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate total stats
    total_revenue = db.query(func.sum(Subscription.revenue)).filter(Subscription.creator_id == current_user.id).scalar() or 0
    total_engine_cut = db.query(func.sum(Subscription.engine_cut)).filter(Subscription.creator_id == current_user.id).scalar() or 0
    total_creator_cut = db.query(func.sum(Subscription.creator_cut)).filter(Subscription.creator_id == current_user.id).scalar() or 0
    total_subscriptions = db.query(Subscription).filter(Subscription.creator_id == current_user.id).count()

    stats = RevenueStats(
        total_revenue=total_revenue,
        total_engine_cut=total_engine_cut,
        total_creator_cut=total_creator_cut,
        total_subscriptions=total_subscriptions
    )

    # Get recent subscriptions
    subscriptions = db.query(Subscription).filter(Subscription.creator_id == current_user.id).order_by(Subscription.timestamp.desc()).limit(100).all()

    return RevenueData(stats=stats, subscriptions=subscriptions)
