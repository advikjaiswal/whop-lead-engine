from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base


class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    # Lead metrics
    leads_generated = Column(Integer, default=0, nullable=False)
    leads_contacted = Column(Integer, default=0, nullable=False)
    leads_converted = Column(Integer, default=0, nullable=False)
    lead_conversion_rate = Column(Float, default=0.0, nullable=False)
    
    # Outreach metrics
    messages_sent = Column(Integer, default=0, nullable=False)
    messages_opened = Column(Integer, default=0, nullable=False)
    messages_replied = Column(Integer, default=0, nullable=False)
    outreach_response_rate = Column(Float, default=0.0, nullable=False)
    
    # Retention metrics
    members_at_risk = Column(Integer, default=0, nullable=False)
    retention_messages_sent = Column(Integer, default=0, nullable=False)
    members_retained = Column(Integer, default=0, nullable=False)
    retention_success_rate = Column(Float, default=0.0, nullable=False)
    
    # Revenue metrics
    new_member_revenue = Column(Float, default=0.0, nullable=False)
    retained_member_revenue = Column(Float, default=0.0, nullable=False)
    total_revenue = Column(Float, default=0.0, nullable=False)
    platform_fee = Column(Float, default=0.0, nullable=False)
    client_revenue = Column(Float, default=0.0, nullable=False)
    
    # AI metrics
    ai_api_calls = Column(Integer, default=0, nullable=False)
    ai_cost = Column(Float, default=0.0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="analytics")


class RevenueTransaction(Base):
    __tablename__ = "revenue_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Transaction details
    stripe_payment_intent_id = Column(String(255), nullable=False)
    stripe_subscription_id = Column(String(255), nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    
    # Revenue breakdown
    gross_amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False)
    client_amount = Column(Float, nullable=False)
    platform_fee_percentage = Column(Float, nullable=False)
    
    # Transaction type
    transaction_type = Column(String(50), nullable=False)  # new_member, retention, upgrade
    description = Column(Text, nullable=True)
    
    # Status
    status = Column(String(50), nullable=False)  # pending, completed, failed, refunded
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    member = relationship("Member")