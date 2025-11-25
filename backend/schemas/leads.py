from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from backend.models.lead import LeadStatus

class LeadDiscoveryRequest(BaseModel):
    niche: str
    keywords: List[str]
    subreddits: Optional[List[str]] = ["entrepreneur", "business", "startups"]
    max_leads: Optional[int] = 10

class LeadResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str
    source_url: str
    subreddit: str
    quality_score: float
    sentiment: str
    discovered_at: datetime
    
    # New fields
    status: LeadStatus
    outreach_stage: str
    attribution_id: Optional[str] = None

    class Config:
        from_attributes = True
