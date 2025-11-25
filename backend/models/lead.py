from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base
import enum

class LeadStatus(str, enum.Enum):
    COLD = "cold"
    WARM = "warm"
    HOT = "hot"

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Original discovery fields
    title = Column(String)
    content = Column(Text)
    author = Column(String) # This is the 'username'
    source_url = Column(String) # This is the 'profile_url'
    source_platform = Column(String, default="reddit") # This is the 'source'
    subreddit = Column(String)
    quality_score = Column(Float, default=0.0)
    sentiment = Column(String)
    keywords_matched = Column(Text)
    discovered_at = Column(DateTime, default=datetime.utcnow) # This is 'captured_at'

    # New outreach tracking fields from checklist
    status = Column(SQLAlchemyEnum(LeadStatus), default=LeadStatus.COLD)
    outreach_stage = Column(String, default="pending") # e.g., pending, contacted, followed_up, converted
    assigned_message_flow_id = Column(Integer, ForeignKey("message_flows.id"), nullable=True)
    attribution_id = Column(String, unique=True, index=True, nullable=True)

    owner = relationship("User")
    message_flow = relationship("MessageFlow")

# We need to define MessageFlow model as well
class MessageFlow(Base):
    __tablename__ = "message_flows"
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    
    # Editable messaging flows
    welcome_message = Column(Text)
    follow_up_sequence = Column(Text) # Could be JSON for multiple steps
    offer_push = Column(Text)
    abandoned_funnel_ping = Column(Text)
    winback_attempt = Column(Text)

    creator = relationship("User")

