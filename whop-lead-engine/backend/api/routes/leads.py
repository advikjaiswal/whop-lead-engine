from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from math import ceil
import json
from loguru import logger

from config.database import get_db
from models.user import User
from models.lead import Lead, LeadStatus, LeadSource
from schemas.leads import (
    LeadCreate, LeadImport, LeadUpdate, LeadResponse, 
    LeadListResponse, LeadAnalyzeRequest, LeadAnalysisResponse
)
from utils.auth import get_current_active_user
from utils.exceptions import NotFoundError, ValidationError
from services.ai_service import AIService
from services.lead_scraper import LeadScraperService

router = APIRouter()


@router.get("/", response_model=LeadListResponse)
async def get_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    quality_grade: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's leads with pagination and filtering"""
    
    query = db.query(Lead).filter(Lead.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.filter(Lead.status == status)
    if source:
        query = query.filter(Lead.source == source)
    if quality_grade:
        query = query.filter(Lead.quality_grade == quality_grade)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    leads = query.offset(offset).limit(per_page).all()
    
    total_pages = ceil(total / per_page)
    
    return LeadListResponse(
        leads=[LeadResponse.from_orm(lead) for lead in leads],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_data: LeadCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new lead"""
    
    # Check for duplicates
    existing_lead = None
    if lead_data.email:
        existing_lead = db.query(Lead).filter(
            Lead.user_id == current_user.id,
            Lead.email == lead_data.email
        ).first()
    elif lead_data.username:
        existing_lead = db.query(Lead).filter(
            Lead.user_id == current_user.id,
            Lead.username == lead_data.username,
            Lead.source == lead_data.source
        ).first()
    
    if existing_lead:
        raise ValidationError("Lead already exists")
    
    # Create lead
    lead = Lead(
        user_id=current_user.id,
        name=lead_data.name,
        email=lead_data.email,
        username=lead_data.username,
        profile_url=lead_data.profile_url,
        source=lead_data.source,
        contact_method=lead_data.contact_method
    )
    
    db.add(lead)
    db.commit()
    db.refresh(lead)
    
    # Analyze lead with AI (async task in production)
    try:
        ai_service = AIService()
        analysis = await ai_service.analyze_lead(lead)
        
        lead.intent_score = analysis.get('intent_score', 0.0)
        lead.quality_grade = analysis.get('quality_grade', 'D')
        lead.interests = json.dumps(analysis.get('interests', []))
        lead.pain_points = json.dumps(analysis.get('pain_points', []))
        lead.ai_summary = analysis.get('summary', '')
        lead.personalization_data = json.dumps(analysis.get('personalization_data', {}))
        
        db.commit()
        db.refresh(lead)
    except Exception as e:
        logger.error(f"Failed to analyze lead {lead.id}: {e}")
    
    logger.info(f"Created lead {lead.id} for user {current_user.id}")
    
    return LeadResponse.from_orm(lead)


@router.post("/import", response_model=List[LeadResponse])
async def import_leads(
    lead_import: LeadImport,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import multiple leads"""
    
    created_leads = []
    errors = []
    
    for lead_data in lead_import.leads:
        try:
            # Check for duplicates
            existing_lead = None
            if lead_data.email:
                existing_lead = db.query(Lead).filter(
                    Lead.user_id == current_user.id,
                    Lead.email == lead_data.email
                ).first()
            elif lead_data.username:
                existing_lead = db.query(Lead).filter(
                    Lead.user_id == current_user.id,
                    Lead.username == lead_data.username,
                    Lead.source == lead_data.source
                ).first()
            
            if existing_lead:
                errors.append(f"Lead already exists: {lead_data.email or lead_data.username}")
                continue
            
            # Create lead
            lead = Lead(
                user_id=current_user.id,
                name=lead_data.name,
                email=lead_data.email,
                username=lead_data.username,
                profile_url=lead_data.profile_url,
                source=lead_data.source,
                contact_method=lead_data.contact_method
            )
            
            db.add(lead)
            db.commit()
            db.refresh(lead)
            
            created_leads.append(LeadResponse.from_orm(lead))
            
        except Exception as e:
            errors.append(f"Failed to create lead: {str(e)}")
    
    if errors:
        logger.warning(f"Lead import errors for user {current_user.id}: {errors}")
    
    logger.info(f"Imported {len(created_leads)} leads for user {current_user.id}")
    
    return created_leads


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific lead"""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise NotFoundError("Lead not found")
    
    return LeadResponse.from_orm(lead)


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead_update: LeadUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a lead"""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise NotFoundError("Lead not found")
    
    # Update fields
    if lead_update.name is not None:
        lead.name = lead_update.name
    if lead_update.email is not None:
        lead.email = lead_update.email
    if lead_update.username is not None:
        lead.username = lead_update.username
    if lead_update.status is not None:
        lead.status = lead_update.status
    if lead_update.contact_method is not None:
        lead.contact_method = lead_update.contact_method
    
    db.commit()
    db.refresh(lead)
    
    logger.info(f"Updated lead {lead.id} for user {current_user.id}")
    
    return LeadResponse.from_orm(lead)


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a lead"""
    
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.user_id == current_user.id
    ).first()
    
    if not lead:
        raise NotFoundError("Lead not found")
    
    db.delete(lead)
    db.commit()
    
    logger.info(f"Deleted lead {lead.id} for user {current_user.id}")
    
    return {"message": "Lead deleted successfully"}


@router.post("/analyze", response_model=List[LeadResponse])
async def analyze_leads(
    analyze_request: LeadAnalyzeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze and import leads from external sources"""
    
    scraper_service = LeadScraperService()
    ai_service = AIService()
    
    leads_data = []
    
    # Scrape leads from different sources
    for source in analyze_request.sources:
        try:
            if source == LeadSource.REDDIT:
                scraped_leads = await scraper_service.scrape_reddit(
                    keywords=analyze_request.keywords,
                    max_results=analyze_request.max_leads // len(analyze_request.sources)
                )
                leads_data.extend(scraped_leads)
            elif source == LeadSource.TWITTER:
                scraped_leads = await scraper_service.scrape_twitter(
                    keywords=analyze_request.keywords,
                    max_results=analyze_request.max_leads // len(analyze_request.sources)
                )
                leads_data.extend(scraped_leads)
            # Add more sources as needed
        except Exception as e:
            logger.error(f"Failed to scrape {source}: {e}")
    
    # Create and analyze leads
    created_leads = []
    
    for lead_data in leads_data[:analyze_request.max_leads]:
        try:
            # Check for duplicates
            existing_lead = db.query(Lead).filter(
                Lead.user_id == current_user.id,
                Lead.username == lead_data.get('username'),
                Lead.source == lead_data.get('source')
            ).first()
            
            if existing_lead:
                continue
            
            # Create lead
            lead = Lead(
                user_id=current_user.id,
                name=lead_data.get('name'),
                username=lead_data.get('username'),
                profile_url=lead_data.get('profile_url'),
                source=lead_data.get('source')
            )
            
            db.add(lead)
            db.commit()
            db.refresh(lead)
            
            # Analyze with AI
            try:
                analysis = await ai_service.analyze_lead(lead)
                lead.intent_score = analysis.get('intent_score', 0.0)
                lead.quality_grade = analysis.get('quality_grade', 'D')
                lead.interests = json.dumps(analysis.get('interests', []))
                lead.pain_points = json.dumps(analysis.get('pain_points', []))
                lead.ai_summary = analysis.get('summary', '')
                lead.personalization_data = json.dumps(analysis.get('personalization_data', {}))
                
                db.commit()
                db.refresh(lead)
            except Exception as e:
                logger.error(f"Failed to analyze lead {lead.id}: {e}")
            
            created_leads.append(LeadResponse.from_orm(lead))
            
        except Exception as e:
            logger.error(f"Failed to create lead: {e}")
    
    logger.info(f"Analyzed and created {len(created_leads)} leads for user {current_user.id}")
    
    return created_leads