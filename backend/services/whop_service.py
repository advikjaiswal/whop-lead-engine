import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
from config.settings import get_settings

settings = get_settings()


class WhopService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = settings.WHOP_API_URL
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def get_community_members(self, community_id: str) -> List[Dict[str, Any]]:
        """Get all members of a Whop community"""
        
        # TODO: Replace with actual Whop API implementation
        # For now, return mock data since Whop API access requires actual community
        logger.warning("Whop API not implemented - returning mock member data")
        return self._generate_mock_members(community_id)
    
    async def get_member_activity(self, member_id: str) -> Dict[str, Any]:
        """Get activity data for a specific member"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/members/{member_id}/activity",
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get member activity: {response.text}")
                    return self._generate_mock_activity(member_id)
                    
        except Exception as e:
            logger.error(f"Error getting member activity: {e}")
            return self._generate_mock_activity(member_id)
    
    async def get_community_analytics(self, community_id: str) -> Dict[str, Any]:
        """Get analytics for a Whop community"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/communities/{community_id}/analytics",
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get community analytics: {response.text}")
                    return self._generate_mock_analytics(community_id)
                    
        except Exception as e:
            logger.error(f"Error getting community analytics: {e}")
            return self._generate_mock_analytics(community_id)
    
    async def send_member_message(self, member_id: str, message: str) -> bool:
        """Send a direct message to a member through Whop"""
        
        try:
            payload = {
                "recipient_id": member_id,
                "message": message,
                "type": "direct_message"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=self.headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    logger.info(f"Message sent to member {member_id}")
                    return True
                else:
                    logger.error(f"Failed to send message: {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending message to member {member_id}: {e}")
            return False
    
    async def get_subscription_data(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription data from Whop"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/subscriptions/{subscription_id}",
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get subscription data: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting subscription data: {e}")
            return None
    
    def _generate_mock_members(self, community_id: str) -> List[Dict[str, Any]]:
        """Generate mock member data for development/testing"""
        
        mock_members = []
        
        # Generate 20 mock members with realistic data
        for i in range(20):
            member_id = f"whop_member_{i+1:03d}"
            days_ago = i * 2  # Spread join dates
            
            mock_members.append({
                "id": member_id,
                "email": f"member{i+1}@example.com",
                "username": f"member_{i+1}",
                "full_name": f"Member {i+1}",
                "status": "active" if i % 10 != 0 else "inactive",  # 10% inactive
                "tier": "premium" if i % 3 == 0 else "basic",
                "monthly_revenue": 49.99 if i % 3 == 0 else 29.99,
                "joined_at": datetime.now().isoformat(),
                "last_login": (datetime.now()).isoformat() if i % 5 != 0 else None,
                "last_message": (datetime.now()).isoformat() if i % 4 != 0 else None,
                "total_messages": max(0, 50 - (i * 2))  # Decreasing activity
            })
        
        logger.info(f"Generated {len(mock_members)} mock members for community {community_id}")
        return mock_members
    
    def _generate_mock_activity(self, member_id: str) -> Dict[str, Any]:
        """Generate mock activity data for a member"""
        
        return {
            "member_id": member_id,
            "last_login": datetime.now().isoformat(),
            "messages_sent": 15,
            "messages_received": 8,
            "files_uploaded": 3,
            "reactions_given": 25,
            "reactions_received": 18,
            "threads_created": 2,
            "replies_made": 12,
            "activity_score": 85.5,
            "weekly_activity": [
                {"date": "2024-01-01", "score": 90},
                {"date": "2024-01-02", "score": 75},
                {"date": "2024-01-03", "score": 80},
                {"date": "2024-01-04", "score": 95},
                {"date": "2024-01-05", "score": 70},
                {"date": "2024-01-06", "score": 85},
                {"date": "2024-01-07", "score": 88}
            ]
        }
    
    def _generate_mock_analytics(self, community_id: str) -> Dict[str, Any]:
        """Generate mock analytics data for a community"""
        
        return {
            "community_id": community_id,
            "total_members": 157,
            "active_members": 142,
            "new_members_this_week": 8,
            "churn_rate": 2.5,
            "engagement_rate": 78.5,
            "revenue_metrics": {
                "total_revenue": 4847.32,
                "monthly_recurring_revenue": 4200.00,
                "average_revenue_per_user": 30.87
            },
            "activity_metrics": {
                "messages_per_day": 45,
                "active_users_per_day": 28,
                "files_shared": 12,
                "threads_created": 6
            },
            "growth_metrics": {
                "member_growth_rate": 5.2,
                "revenue_growth_rate": 8.7,
                "retention_rate": 94.5
            }
        }


class WhopWebhookHandler:
    """Handle webhooks from Whop for real-time updates"""
    
    @staticmethod
    async def handle_member_joined(data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle member joined webhook"""
        
        logger.info(f"New member joined: {data.get('member_id')}")
        
        return {
            "member_id": data.get("member_id"),
            "email": data.get("email"),
            "joined_at": data.get("joined_at"),
            "tier": data.get("tier"),
            "revenue": data.get("monthly_revenue")
        }
    
    @staticmethod
    async def handle_member_left(data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle member left webhook"""
        
        logger.info(f"Member left: {data.get('member_id')}")
        
        return {
            "member_id": data.get("member_id"),
            "left_at": data.get("left_at"),
            "reason": data.get("reason", "voluntary")
        }
    
    @staticmethod
    async def handle_payment_received(data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle payment received webhook"""
        
        logger.info(f"Payment received: ${data.get('amount')} from {data.get('member_id')}")
        
        return {
            "member_id": data.get("member_id"),
            "amount": data.get("amount"),
            "payment_date": data.get("payment_date"),
            "subscription_id": data.get("subscription_id")
        }
    
    @staticmethod
    async def handle_member_activity(data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle member activity webhook"""
        
        return {
            "member_id": data.get("member_id"),
            "activity_type": data.get("activity_type"),
            "timestamp": data.get("timestamp"),
            "details": data.get("details", {})
        }