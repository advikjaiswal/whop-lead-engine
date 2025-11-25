from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from backend.database import Base
import enum

class WorkspaceType(str, enum.Enum):
    DISCORD = "discord"
    TELEGRAM = "telegram"
    SLACK = "slack"

class MessagingTone(str, enum.Enum):
    AGGRESSIVE = "aggressive"
    FRIENDLY = "friendly"
    NEUTRAL = "neutral"

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), unique=True) # Each user has one workspace

    # Required Fields from checklist
    whop_api_key = Column(String, nullable=False)
    workspace_type = Column(SQLAlchemyEnum(WorkspaceType), nullable=False)
    bot_token = Column(String, nullable=False)
    stripe_secret_key = Column(String, nullable=False)
    paid_product_id = Column(String, nullable=False)
    brand_name = Column(String, nullable=False)
    community_name = Column(String, nullable=False)
    primary_offer = Column(String, nullable=False)
    guild_id = Column(String, nullable=True) # Discord Server ID

    # Optional Enhancements
    custom_welcome_script = Column(Text, nullable=True)
    messaging_tone = Column(SQLAlchemyEnum(MessagingTone), default=MessagingTone.NEUTRAL)
    creator_profile_pic_url = Column(String, nullable=True)
    discount_code = Column(String, nullable=True)

    creator = relationship("User")
