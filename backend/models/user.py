from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from config.database import Base


class UserRole(enum.Enum):
    ADMIN = "admin"
    CLIENT = "client"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Whop community details
    whop_community_id = Column(String(100), nullable=True)
    whop_community_name = Column(String(255), nullable=True)
    whop_api_key = Column(Text, nullable=True)  # Encrypted
    
    # Stripe Connect
    stripe_account_id = Column(String(100), nullable=True)
    stripe_onboarding_complete = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    leads = relationship("Lead", back_populates="user")
    outreach_campaigns = relationship("OutreachCampaign", back_populates="user")
    members = relationship("Member", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")
    lead_criteria = relationship("LeadCriteria", back_populates="user")