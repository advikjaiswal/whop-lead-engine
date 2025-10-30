from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from config.database import Base


class MemberStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CHURNED = "churned"
    PAUSED = "paused"


class ChurnRisk(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Member(Base):
    __tablename__ = "members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Member information
    whop_member_id = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), nullable=True)
    username = Column(String(100), nullable=True)
    full_name = Column(String(255), nullable=True)
    
    # Membership details
    status = Column(Enum(MemberStatus), default=MemberStatus.ACTIVE, nullable=False)
    tier = Column(String(100), nullable=True)
    subscription_id = Column(String(100), nullable=True)
    monthly_revenue = Column(Float, nullable=True)
    
    # Activity tracking
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_message = Column(DateTime(timezone=True), nullable=True)
    total_messages = Column(Integer, default=0, nullable=False)
    activity_score = Column(Float, default=0.0, nullable=False)  # 0-100
    
    # Churn prediction
    churn_risk = Column(Enum(ChurnRisk), default=ChurnRisk.LOW, nullable=False)
    churn_score = Column(Float, default=0.0, nullable=False)  # 0-1
    days_inactive = Column(Integer, default=0, nullable=False)
    
    # Retention efforts
    retention_messages_sent = Column(Integer, default=0, nullable=False)
    last_retention_contact = Column(DateTime(timezone=True), nullable=True)
    retention_successful = Column(Boolean, nullable=True)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), nullable=False)
    churned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="members")
    retention_messages = relationship("RetentionMessage", back_populates="member")


class RetentionMessage(Base):
    __tablename__ = "retention_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    
    # Message details
    message_type = Column(String(50), nullable=False)  # reminder, coupon, personal_check_in
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    
    # Delivery tracking
    sent_at = Column(DateTime(timezone=True), nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Outcome tracking
    member_returned = Column(Boolean, nullable=True)
    return_date = Column(DateTime(timezone=True), nullable=True)
    
    # External tracking
    external_message_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    member = relationship("Member", back_populates="retention_messages")