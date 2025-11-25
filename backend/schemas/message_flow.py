from pydantic import BaseModel
from typing import Optional

class MessageFlowBase(BaseModel):
    name: str
    welcome_message: Optional[str] = None
    follow_up_sequence: Optional[str] = None
    offer_push: Optional[str] = None
    abandoned_funnel_ping: Optional[str] = None
    winback_attempt: Optional[str] = None

class MessageFlowCreate(MessageFlowBase):
    pass

class MessageFlowUpdate(MessageFlowBase):
    pass

class MessageFlowInDB(MessageFlowBase):
    id: int
    creator_id: int

    class Config:
        from_attributes = True
