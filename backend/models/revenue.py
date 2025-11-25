from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base
import enum

class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    stripe_subscription_id = Column(String, unique=True, index=True)
    stripe_customer_id = Column(String, index=True)
    plan_id = Column(String)
    revenue = Column(Float) # Revenue from this subscription event
    
    # Link to the lead that converted
    attribution_id = Column(String, ForeignKey("leads.attribution_id"))
    lead = relationship("Lead")

    # Link to the creator who gets paid
    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User")

    # Revenue share calculation
    engine_cut = Column(Float)
    creator_cut = Column(Float)

    timestamp = Column(DateTime, default=datetime.utcnow)

class RevenueSummary(Base):
    __tablename__ = "revenue_summaries"
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    month = Column(String) # e.g., "2025-11"
    total_new_subs = Column(Integer)
    total_revenue_generated = Column(Float)
    total_engine_cut = Column(Float)
    total_creator_cut = Column(Float)
    payout_status = Column(SQLAlchemyEnum(PayoutStatus), default=PayoutStatus.PENDING)

    creator = relationship("User")
