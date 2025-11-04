from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from config.database import Base


class LeadStatus(enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    RESPONDED = "responded"
    CONVERTED = "converted"
    IGNORED = "ignored"
    UNQUALIFIED = "unqualified"


class LeadSource(enum.Enum):
    REDDIT = "reddit"
    TWITTER = "twitter"
    DISCORD = "discord"
    MANUAL = "manual"


class QualityGrade(enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Lead identification
    external_id = Column(String(255), nullable=True)  # ID from source platform
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    username = Column(String(255), nullable=True)
    
    # Source information
    source = Column(Enum(LeadSource), nullable=False)
    url = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    
    # AI Analysis
    intent_score = Column(Float, default=0.0, nullable=False)  # 0-1
    quality_grade = Column(Enum(QualityGrade), default=QualityGrade.D, nullable=False)
    summary = Column(Text, nullable=True)
    
    # Categorization
    interests = Column(JSON, nullable=True)  # Array of strings
    pain_points = Column(JSON, nullable=True)  # Array of strings
    
    # Personalization data
    personalization_data = Column(JSON, nullable=True)  # AI recommendations
    
    # Status tracking
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, nullable=False)
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Platform specific data
    platform_data = Column(JSON, nullable=True)  # Reddit/Twitter specific info
    
    # Timestamps
    discovered_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="leads")
    outreach_messages = relationship("OutreachMessage", back_populates="lead")


class LeadCriteria(Base):
    __tablename__ = "lead_criteria"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Criteria configuration
    name = Column(String(255), nullable=False)
    niche = Column(String(100), nullable=False)
    keywords = Column(JSON, nullable=False)  # Array of keywords
    subreddits = Column(JSON, nullable=True)  # Array of subreddit names
    
    # Filtering options
    min_intent_score = Column(Float, default=0.5, nullable=False)
    min_quality_grade = Column(String(1), default='C', nullable=False)
    exclude_keywords = Column(JSON, nullable=True)  # Array of negative keywords
    
    # Discovery settings
    is_active = Column(Boolean, default=True, nullable=False)
    discovery_frequency = Column(String(20), default='daily', nullable=False)  # daily, weekly
    max_leads_per_day = Column(Integer, default=50, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="lead_criteria")