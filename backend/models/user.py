from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Stripe Connect
    stripe_account_id = Column(String, nullable=True)
    stripe_access_token = Column(String, nullable=True)
    stripe_refresh_token = Column(String, nullable=True)
    stripe_publishable_key = Column(String, nullable=True)
    
    # Relationships
    members = relationship("Member", back_populates="user")
    outreach_campaigns = relationship("OutreachCampaign", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")
