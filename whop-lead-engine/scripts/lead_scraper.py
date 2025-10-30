#!/usr/bin/env python3
"""
Lead Scraper Script
Automated script to scrape leads from various sources and analyze them with AI
"""

import asyncio
import sys
import os
from datetime import datetime
from typing import List
from loguru import logger

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from sqlalchemy.orm import Session
from config.database import SessionLocal
from models.user import User
from models.lead import Lead, LeadSource, LeadStatus
from services.lead_scraper import LeadScraperService
from services.ai_service import AIService
import json


class LeadScraperBot:
    def __init__(self):
        self.scraper_service = LeadScraperService()
        self.ai_service = AIService()
        self.db = SessionLocal()
    
    async def run_for_all_users(self):
        """Run lead scraping for all active users"""
        
        logger.info("Starting lead scraping for all users...")
        
        try:
            # Get all active users who have configured keywords
            users = self.db.query(User).filter(
                User.is_active == True,
                User.whop_community_name.isnot(None)
            ).all()
            
            logger.info(f"Found {len(users)} active users")
            
            for user in users:
                try:
                    await self.scrape_leads_for_user(user)
                    await asyncio.sleep(60)  # Rate limiting between users
                except Exception as e:
                    logger.error(f"Failed to scrape leads for user {user.id}: {e}")
            
            logger.info("Lead scraping completed for all users")
            
        except Exception as e:
            logger.error(f"Lead scraping failed: {e}")
        finally:
            self.db.close()
    
    async def scrape_leads_for_user(self, user: User):
        """Scrape leads for a specific user"""
        
        logger.info(f"Scraping leads for user {user.id} ({user.email})")
        
        # Generate keywords based on community name
        keywords = self.generate_keywords(user.whop_community_name)
        
        # Scrape from different sources
        all_leads = []
        
        try:
            # Reddit leads
            reddit_leads = await self.scraper_service.scrape_reddit(keywords, max_results=20)
            all_leads.extend(reddit_leads)
            
            # Twitter leads
            twitter_leads = await self.scraper_service.scrape_twitter(keywords, max_results=20)
            all_leads.extend(twitter_leads)
            
            logger.info(f"Found {len(all_leads)} potential leads for user {user.id}")
            
            # Process and store leads
            new_leads_count = 0
            
            for lead_data in all_leads:
                try:
                    # Check if lead already exists
                    existing_lead = self.db.query(Lead).filter(
                        Lead.user_id == user.id,
                        Lead.username == lead_data.get('username'),
                        Lead.source == lead_data.get('source')
                    ).first()
                    
                    if existing_lead:
                        continue
                    
                    # Create new lead
                    lead = Lead(
                        user_id=user.id,
                        name=lead_data.get('name'),
                        username=lead_data.get('username'),
                        profile_url=lead_data.get('profile_url'),
                        source=lead_data.get('source'),
                        status=LeadStatus.NEW
                    )
                    
                    self.db.add(lead)
                    self.db.commit()
                    self.db.refresh(lead)
                    
                    # Analyze lead with AI
                    await self.analyze_lead(lead)
                    
                    new_leads_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process lead for user {user.id}: {e}")
                    self.db.rollback()
            
            logger.info(f"Created {new_leads_count} new leads for user {user.id}")
            
        except Exception as e:
            logger.error(f"Lead scraping failed for user {user.id}: {e}")
    
    async def analyze_lead(self, lead: Lead):
        """Analyze lead with AI and update database"""
        
        try:
            analysis = await self.ai_service.analyze_lead(lead)
            
            # Update lead with analysis
            lead.intent_score = analysis.get('intent_score', 0.0)
            lead.quality_grade = analysis.get('quality_grade', 'C')
            lead.interests = json.dumps(analysis.get('interests', []))
            lead.pain_points = json.dumps(analysis.get('pain_points', []))
            lead.ai_summary = analysis.get('summary', '')
            lead.personalization_data = json.dumps(analysis.get('personalization_data', {}))
            
            self.db.commit()
            
            logger.info(f"Analyzed lead {lead.id} - Score: {lead.intent_score}, Grade: {lead.quality_grade}")
            
        except Exception as e:
            logger.error(f"Failed to analyze lead {lead.id}: {e}")
    
    def generate_keywords(self, community_name: str) -> List[str]:
        """Generate search keywords based on community name"""
        
        base_keywords = [
            "online community", "membership site", "discord server",
            "exclusive group", "mastermind", "paid community"
        ]
        
        # Add community-specific keywords
        if community_name:
            words = community_name.lower().split()
            base_keywords.extend(words)
        
        # Add general business keywords
        business_keywords = [
            "entrepreneur", "startup", "side hustle", "passive income",
            "digital marketing", "online business", "freelancing"
        ]
        
        base_keywords.extend(business_keywords)
        
        return list(set(base_keywords))  # Remove duplicates


async def main():
    """Main function to run the lead scraper"""
    
    # Setup logging
    logger.add(
        "../logs/lead_scraper_{time}.log",
        rotation="1 day",
        retention="30 days",
        level="INFO"
    )
    
    logger.info("=" * 50)
    logger.info("LEAD SCRAPER STARTED")
    logger.info("=" * 50)
    
    try:
        bot = LeadScraperBot()
        await bot.run_for_all_users()
    except Exception as e:
        logger.error(f"Lead scraper failed: {e}")
        sys.exit(1)
    
    logger.info("Lead scraper completed successfully")


if __name__ == "__main__":
    asyncio.run(main())