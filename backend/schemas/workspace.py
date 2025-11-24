from pydantic import BaseModel, HttpUrl
from typing import Optional
from backend.models.workspace import WorkspaceType, MessagingTone

class WorkspaceBase(BaseModel):
    whop_api_key: str
    workspace_type: WorkspaceType
    bot_token: str
    stripe_secret_key: Optional[str] = None
    paid_product_id: str
    brand_name: str
    community_name: str
    primary_offer: str
    guild_id: Optional[str] = None

    # Optional Enhancements
    custom_welcome_script: Optional[str] = None
    messaging_tone: Optional[MessagingTone] = MessagingTone.NEUTRAL
    creator_profile_pic_url: Optional[HttpUrl] = None
    discount_code: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(WorkspaceBase):
    pass

class WorkspaceInDB(WorkspaceBase):
    id: int
    creator_id: int

    class Config:
        from_attributes = True
