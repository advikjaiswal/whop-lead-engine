from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from config.database import Base


class CampaignStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class MessageStatus(enum.Enum):
    DRAFT = "draft"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    FAILED = "failed"


class OutreachCampaign(Base):
    __tablename__ = "outreach_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    # Template settings
    subject_template = Column(Text, nullable=True)
    message_template = Column(Text, nullable=False)
    personalization_enabled = Column(Boolean, default=True, nullable=False)
    
    # Campaign metrics
    total_leads = Column(Integer, default=0, nullable=False)
    messages_sent = Column(Integer, default=0, nullable=False)
    responses_received = Column(Integer, default=0, nullable=False)
    conversions = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="outreach_campaigns")
    messages = relationship("OutreachMessage", back_populates="campaign")


class OutreachMessage(Base):
    __tablename__ = "outreach_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("outreach_campaigns.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    
    # Message content
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    personalized_content = Column(Text, nullable=True)
    
    # Status and tracking
    status = Column(Enum(MessageStatus), default=MessageStatus.DRAFT, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)
    
    # External IDs for tracking
    external_message_id = Column(String(255), nullable=True)
    tracking_pixel_id = Column(String(255), nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    campaign = relationship("OutreachCampaign", back_populates="messages")
    lead = relationship("Lead", back_populates="outreach_messages")