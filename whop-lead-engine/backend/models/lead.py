from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from config.database import Base


class LeadStatus(enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    RESPONDED = "responded"
    CONVERTED = "converted"
    REJECTED = "rejected"


class LeadSource(enum.Enum):
    REDDIT = "reddit"
    TWITTER = "twitter"
    DISCORD = "discord"
    MANUAL = "manual"
    IMPORT = "import"


class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Lead information
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    username = Column(String(100), nullable=True)
    profile_url = Column(Text, nullable=True)
    
    # Lead classification
    source = Column(Enum(LeadSource), nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, nullable=False)
    intent_score = Column(Float, default=0.0, nullable=False)  # 0-1 score from AI
    quality_grade = Column(String(1), nullable=True)  # A, B, C, D
    
    # Contact information
    contact_method = Column(String(50), nullable=True)  # email, dm, etc.
    last_contacted = Column(DateTime(timezone=True), nullable=True)
    contact_count = Column(Integer, default=0, nullable=False)
    
    # Conversion tracking
    converted_at = Column(DateTime(timezone=True), nullable=True)
    conversion_value = Column(Float, nullable=True)  # Revenue generated
    
    # AI analysis
    interests = Column(Text, nullable=True)  # JSON array of interests
    pain_points = Column(Text, nullable=True)  # JSON array of pain points
    ai_summary = Column(Text, nullable=True)
    personalization_data = Column(Text, nullable=True)  # JSON for personalized outreach
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="leads")
    outreach_messages = relationship("OutreachMessage", back_populates="lead")