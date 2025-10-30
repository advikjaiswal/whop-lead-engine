from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from models.lead import LeadStatus, LeadSource


class LeadCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    profile_url: Optional[str] = None
    source: LeadSource
    contact_method: Optional[str] = None


class LeadImport(BaseModel):
    leads: List[LeadCreate]


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    status: Optional[LeadStatus] = None
    contact_method: Optional[str] = None


class LeadAnalyzeRequest(BaseModel):
    keywords: List[str]
    sources: List[LeadSource]
    max_leads: Optional[int] = 100


class LeadResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    profile_url: Optional[str] = None
    source: LeadSource
    status: LeadStatus
    intent_score: float
    quality_grade: Optional[str] = None
    contact_method: Optional[str] = None
    last_contacted: Optional[datetime] = None
    contact_count: int
    converted_at: Optional[datetime] = None
    conversion_value: Optional[float] = None
    interests: Optional[str] = None
    pain_points: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LeadListResponse(BaseModel):
    leads: List[LeadResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class LeadAnalysisResponse(BaseModel):
    lead_id: int
    intent_score: float
    quality_grade: str
    interests: List[str]
    pain_points: List[str]
    ai_summary: str
    personalization_data: dict