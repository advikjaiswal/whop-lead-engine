#!/usr/bin/env python3
"""
Retention Bot Script
Automated script to monitor member activity and send retention messages
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
from loguru import logger

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from sqlalchemy.orm import Session
from config.database import SessionLocal
from models.user import User
from models.member import Member, RetentionMessage, MemberStatus, ChurnRisk
from services.whop_service import WhopService
from services.ai_service import AIService
from services.email_service import EmailService


class RetentionBot:
    def __init__(self):
        self.ai_service = AIService()
        self.email_service = EmailService()
        self.db = SessionLocal()
    
    async def run_for_all_users(self):
        """Run retention monitoring for all active users"""
        
        logger.info("Starting retention monitoring for all users...")
        
        try:
            # Get all active users
            users = self.db.query(User).filter(
                User.is_active == True,
                User.whop_api_key.isnot(None)
            ).all()
            
            logger.info(f"Found {len(users)} active users with Whop integration")
            
            for user in users:
                try:
                    await self.process_user_retention(user)
                    await asyncio.sleep(30)  # Rate limiting between users
                except Exception as e:
                    logger.error(f"Failed to process retention for user {user.id}: {e}")
            
            logger.info("Retention monitoring completed for all users")
            
        except Exception as e:
            logger.error(f"Retention monitoring failed: {e}")
        finally:
            self.db.close()
    
    async def process_user_retention(self, user: User):
        """Process retention for a specific user"""
        
        logger.info(f"Processing retention for user {user.id} ({user.email})")
        
        try:
            # Sync members from Whop
            await self.sync_members(user)
            
            # Update churn predictions
            await self.update_churn_predictions(user.id)
            
            # Send retention messages to at-risk members
            await self.send_retention_messages(user)
            
            logger.info(f"Retention processing completed for user {user.id}")
            
        except Exception as e:
            logger.error(f"Retention processing failed for user {user.id}: {e}")
    
    async def sync_members(self, user: User):
        """Sync member data from Whop"""
        
        if not user.whop_api_key:
            logger.warning(f"No Whop API key for user {user.id}")
            return
        
        try:
            whop_service = WhopService(user.whop_api_key)
            whop_members = await whop_service.get_community_members(user.whop_community_id)
            
            synced_count = 0
            updated_count = 0
            
            for whop_member in whop_members:
                existing_member = self.db.query(Member).filter(
                    Member.user_id == user.id,
                    Member.whop_member_id == whop_member['id']
                ).first()
                
                if existing_member:
                    # Update existing member
                    self.update_member_from_whop_data(existing_member, whop_member)
                    updated_count += 1
                else:
                    # Create new member
                    member = self.create_member_from_whop_data(user.id, whop_member)
                    self.db.add(member)
                    synced_count += 1
            
            self.db.commit()
            logger.info(f"Synced {synced_count} new members, updated {updated_count} for user {user.id}")
            
        except Exception as e:
            logger.error(f"Failed to sync members for user {user.id}: {e}")
    
    def create_member_from_whop_data(self, user_id: int, whop_member: Dict[str, Any]) -> Member:
        """Create a new member from Whop data"""
        
        return Member(
            user_id=user_id,
            whop_member_id=whop_member['id'],
            email=whop_member.get('email'),
            username=whop_member.get('username'),
            full_name=whop_member.get('full_name'),
            status=MemberStatus(whop_member.get('status', 'active')),
            tier=whop_member.get('tier'),
            monthly_revenue=whop_member.get('monthly_revenue'),
            last_login=whop_member.get('last_login'),
            last_message=whop_member.get('last_message'),
            total_messages=whop_member.get('total_messages', 0),
            joined_at=whop_member.get('joined_at', datetime.utcnow())
        )
    
    def update_member_from_whop_data(self, member: Member, whop_member: Dict[str, Any]):
        """Update existing member with Whop data"""
        
        member.email = whop_member.get('email')
        member.username = whop_member.get('username')
        member.full_name = whop_member.get('full_name')
        member.status = MemberStatus(whop_member.get('status', 'active'))
        member.tier = whop_member.get('tier')
        member.monthly_revenue = whop_member.get('monthly_revenue')
        member.last_login = whop_member.get('last_login')
        member.last_message = whop_member.get('last_message')
        member.total_messages = whop_member.get('total_messages', 0)
    
    async def update_churn_predictions(self, user_id: int):
        """Update churn predictions for all user's members"""
        
        members = self.db.query(Member).filter(Member.user_id == user_id).all()
        
        for member in members:
            # Calculate days inactive
            now = datetime.utcnow()
            
            if member.last_login:
                member.days_inactive = (now - member.last_login).days
            elif member.last_message:
                member.days_inactive = (now - member.last_message).days
            else:
                member.days_inactive = (now - member.joined_at).days
            
            # Update churn risk based on activity
            if member.days_inactive >= 30:
                member.churn_risk = ChurnRisk.CRITICAL
                member.churn_score = 0.9
            elif member.days_inactive >= 14:
                member.churn_risk = ChurnRisk.HIGH
                member.churn_score = 0.7
            elif member.days_inactive >= 7:
                member.churn_risk = ChurnRisk.MEDIUM
                member.churn_score = 0.4
            else:
                member.churn_risk = ChurnRisk.LOW
                member.churn_score = 0.1
            
            # Calculate activity score
            base_score = 100
            base_score -= member.days_inactive * 2
            base_score += member.total_messages * 0.1
            member.activity_score = max(0, min(100, base_score))
        
        self.db.commit()
        
        at_risk_count = len([m for m in members if m.churn_risk in [ChurnRisk.HIGH, ChurnRisk.CRITICAL]])
        logger.info(f"Updated churn predictions: {at_risk_count} members at risk for user {user_id}")
    
    async def send_retention_messages(self, user: User):
        """Send retention messages to at-risk members"""
        
        # Get members who need retention messages
        members_to_contact = self.db.query(Member).filter(
            Member.user_id == user.id,
            Member.churn_risk.in_([ChurnRisk.HIGH, ChurnRisk.CRITICAL]),
            Member.email.isnot(None),
            Member.status == MemberStatus.ACTIVE
        ).all()
        
        # Filter out members contacted recently
        now = datetime.utcnow()
        members_to_contact = [
            m for m in members_to_contact
            if not m.last_retention_contact or 
            (now - m.last_retention_contact).days >= 7  # Don't spam - wait 7 days
        ]
        
        if not members_to_contact:
            logger.info(f"No members need retention messages for user {user.id}")
            return
        
        logger.info(f"Sending retention messages to {len(members_to_contact)} members for user {user.id}")
        
        messages_sent = 0
        
        for member in members_to_contact:
            try:
                # Determine message type based on churn risk
                if member.churn_risk == ChurnRisk.CRITICAL:
                    message_type = "personal_check_in"
                elif member.days_inactive >= 21:
                    message_type = "coupon"
                else:
                    message_type = "reminder"
                
                # Generate personalized retention message
                content = await self.ai_service.generate_retention_message(
                    member_data={
                        "name": member.full_name or member.username,
                        "days_inactive": member.days_inactive,
                        "tier": member.tier,
                        "message_type": message_type
                    },
                    community_name=user.whop_community_name
                )
                
                # Create retention message record
                retention_message = RetentionMessage(
                    member_id=member.id,
                    message_type=message_type,
                    subject=f"We miss you in {user.whop_community_name or 'our community'}!",
                    content=content,
                    sent_at=now
                )
                
                self.db.add(retention_message)
                
                # Send email
                message_id = await self.email_service.send_email(
                    to_email=member.email,
                    subject=retention_message.subject,
                    content=content
                )
                
                if message_id:
                    retention_message.external_message_id = message_id
                    
                    # Update member
                    member.retention_messages_sent += 1
                    member.last_retention_contact = now
                    
                    messages_sent += 1
                    logger.info(f"Sent {message_type} retention message to member {member.id}")
                
                self.db.commit()
                
                # Rate limiting
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Failed to send retention message to member {member.id}: {e}")
                self.db.rollback()
        
        logger.info(f"Sent {messages_sent} retention messages for user {user.id}")
    
    async def track_retention_success(self, user_id: int):
        """Track which retention messages were successful"""
        
        # Get recent retention messages (last 30 days)
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        recent_messages = self.db.query(RetentionMessage).join(Member).filter(
            Member.user_id == user_id,
            RetentionMessage.sent_at >= cutoff_date,
            RetentionMessage.member_returned.is_(None)  # Not yet tracked
        ).all()
        
        for message in recent_messages:
            member = message.member
            
            # Check if member became active after retention message
            if member.last_login and member.last_login > message.sent_at:
                message.member_returned = True
                message.return_date = member.last_login
                logger.info(f"Retention success: Member {member.id} returned after message")
            elif (datetime.utcnow() - message.sent_at).days >= 14:
                # Mark as unsuccessful after 14 days
                message.member_returned = False
        
        self.db.commit()


async def main():
    """Main function to run the retention bot"""
    
    # Setup logging
    logger.add(
        "../logs/retention_bot_{time}.log",
        rotation="1 day",
        retention="30 days",
        level="INFO"
    )
    
    logger.info("=" * 50)
    logger.info("RETENTION BOT STARTED")
    logger.info("=" * 50)
    
    try:
        bot = RetentionBot()
        await bot.run_for_all_users()
    except Exception as e:
        logger.error(f"Retention bot failed: {e}")
        sys.exit(1)
    
    logger.info("Retention bot completed successfully")


if __name__ == "__main__":
    asyncio.run(main())