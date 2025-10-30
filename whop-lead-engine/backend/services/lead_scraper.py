import httpx
import asyncio
from typing import List, Dict, Any, Optional
from loguru import logger
from config.settings import get_settings
from models.lead import LeadSource

settings = get_settings()


class LeadScraperService:
    def __init__(self):
        self.reddit_client_id = settings.REDDIT_CLIENT_ID
        self.reddit_client_secret = settings.REDDIT_CLIENT_SECRET
        self.twitter_bearer_token = settings.TWITTER_BEARER_TOKEN
    
    async def scrape_reddit(self, keywords: List[str], max_results: int = 50) -> List[Dict[str, Any]]:
        """Scrape Reddit for potential leads based on keywords"""
        
        if not self.reddit_client_id or not self.reddit_client_secret:
            logger.warning("Reddit API credentials not configured - returning mock data")
            return self._generate_mock_reddit_leads(keywords, max_results)
        
        try:
            # Get Reddit access token
            access_token = await self._get_reddit_access_token()
            if not access_token:
                return self._generate_mock_reddit_leads(keywords, max_results)
            
            leads = []
            
            for keyword in keywords:
                # Search for posts and comments related to keyword
                posts = await self._search_reddit_posts(access_token, keyword, max_results // len(keywords))
                leads.extend(posts)
                
                if len(leads) >= max_results:
                    break
            
            logger.info(f"Scraped {len(leads)} Reddit leads for keywords: {keywords}")
            return leads[:max_results]
            
        except Exception as e:
            logger.error(f"Reddit scraping failed: {e}")
            return self._generate_mock_reddit_leads(keywords, max_results)
    
    async def scrape_twitter(self, keywords: List[str], max_results: int = 50) -> List[Dict[str, Any]]:
        """Scrape Twitter for potential leads based on keywords"""
        
        if not self.twitter_bearer_token:
            logger.warning("Twitter API credentials not configured - returning mock data")
            return self._generate_mock_twitter_leads(keywords, max_results)
        
        try:
            leads = []
            
            for keyword in keywords:
                # Search for tweets related to keyword
                tweets = await self._search_twitter_tweets(keyword, max_results // len(keywords))
                leads.extend(tweets)
                
                if len(leads) >= max_results:
                    break
            
            logger.info(f"Scraped {len(leads)} Twitter leads for keywords: {keywords}")
            return leads[:max_results]
            
        except Exception as e:
            logger.error(f"Twitter scraping failed: {e}")
            return self._generate_mock_twitter_leads(keywords, max_results)
    
    async def scrape_discord_servers(self, server_ids: List[str], max_results: int = 50) -> List[Dict[str, Any]]:
        """Scrape Discord servers for potential leads (mock implementation)"""
        
        # Note: Discord scraping requires bot permissions and is more complex
        # This is a placeholder for future implementation
        logger.warning("Discord scraping not yet implemented - returning mock data")
        return self._generate_mock_discord_leads(server_ids, max_results)
    
    async def _get_reddit_access_token(self) -> Optional[str]:
        """Get Reddit API access token"""
        
        try:
            auth = httpx.BasicAuth(self.reddit_client_id, self.reddit_client_secret)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://www.reddit.com/api/v1/access_token",
                    auth=auth,
                    data={"grant_type": "client_credentials"},
                    headers={"User-Agent": "WhopLeadEngine/1.0"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("access_token")
                else:
                    logger.error(f"Failed to get Reddit access token: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting Reddit access token: {e}")
            return None
    
    async def _search_reddit_posts(self, access_token: str, keyword: str, limit: int) -> List[Dict[str, Any]]:
        """Search Reddit posts for a specific keyword"""
        
        leads = []
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "WhopLeadEngine/1.0"
            }
            
            # Search in relevant subreddits
            subreddits = [
                "entrepreneur", "startups", "smallbusiness", "marketing",
                "freelance", "digitalnomad", "sidehustle", "passive_income"
            ]
            
            async with httpx.AsyncClient() as client:
                for subreddit in subreddits[:3]:  # Limit to avoid rate limits
                    response = await client.get(
                        f"https://oauth.reddit.com/r/{subreddit}/search",
                        headers=headers,
                        params={
                            "q": keyword,
                            "sort": "relevance",
                            "limit": limit // 3,
                            "restrict_sr": "true"
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        posts = data.get("data", {}).get("children", [])
                        
                        for post in posts:
                            post_data = post.get("data", {})
                            
                            # Filter out posts by bots or deleted users
                            if post_data.get("author") in ["[deleted]", "AutoModerator"]:
                                continue
                            
                            leads.append({
                                "name": None,
                                "username": post_data.get("author"),
                                "profile_url": f"https://reddit.com/u/{post_data.get('author')}",
                                "source": LeadSource.REDDIT,
                                "context": {
                                    "post_title": post_data.get("title"),
                                    "post_content": post_data.get("selftext", "")[:500],
                                    "subreddit": post_data.get("subreddit"),
                                    "score": post_data.get("score", 0)
                                }
                            })
                    
                    # Rate limiting
                    await asyncio.sleep(1)
        
        except Exception as e:
            logger.error(f"Error searching Reddit posts: {e}")
        
        return leads
    
    async def _search_twitter_tweets(self, keyword: str, limit: int) -> List[Dict[str, Any]]:
        """Search Twitter tweets for a specific keyword"""
        
        leads = []
        
        try:
            headers = {
                "Authorization": f"Bearer {self.twitter_bearer_token}",
                "Content-Type": "application/json"
            }
            
            # Twitter API v2 search
            params = {
                "query": f"{keyword} -is:retweet lang:en",
                "max_results": min(limit, 100),  # Twitter API limit
                "expansions": "author_id",
                "user.fields": "username,name,public_metrics,description"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.twitter.com/2/tweets/search/recent",
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    tweets = data.get("data", [])
                    users = {user["id"]: user for user in data.get("includes", {}).get("users", [])}
                    
                    for tweet in tweets:
                        author_id = tweet.get("author_id")
                        user = users.get(author_id, {})
                        
                        leads.append({
                            "name": user.get("name"),
                            "username": user.get("username"),
                            "profile_url": f"https://twitter.com/{user.get('username')}",
                            "source": LeadSource.TWITTER,
                            "context": {
                                "tweet_content": tweet.get("text", "")[:500],
                                "followers_count": user.get("public_metrics", {}).get("followers_count", 0),
                                "bio": user.get("description", "")
                            }
                        })
                else:
                    logger.error(f"Twitter API error: {response.text}")
        
        except Exception as e:
            logger.error(f"Error searching Twitter: {e}")
        
        return leads
    
    def _generate_mock_reddit_leads(self, keywords: List[str], count: int) -> List[Dict[str, Any]]:
        """Generate mock Reddit leads for development/testing"""
        
        mock_users = [
            "startup_founder", "marketing_guru", "freelance_dev", "digital_nomad_life",
            "entrepreneur123", "side_hustle_pro", "content_creator", "ecommerce_expert",
            "productivity_hack", "passive_income_seeker", "business_builder", "growth_hacker"
        ]
        
        leads = []
        for i in range(min(count, len(mock_users))):
            username = mock_users[i]
            keyword = keywords[i % len(keywords)]
            
            leads.append({
                "name": None,
                "username": username,
                "profile_url": f"https://reddit.com/u/{username}",
                "source": LeadSource.REDDIT,
                "context": {
                    "post_title": f"Looking for advice on {keyword}",
                    "post_content": f"I've been working on {keyword} and would love to connect with others...",
                    "subreddit": "entrepreneur",
                    "score": 15
                }
            })
        
        logger.info(f"Generated {len(leads)} mock Reddit leads")
        return leads
    
    def _generate_mock_twitter_leads(self, keywords: List[str], count: int) -> List[Dict[str, Any]]:
        """Generate mock Twitter leads for development/testing"""
        
        mock_users = [
            ("Sarah Johnson", "sarahj_startup"), ("Mike Chen", "mikec_marketing"),
            ("Alex Rivera", "alexr_freelance"), ("Emma Wilson", "emmaw_digital"),
            ("David Kim", "davidk_entrepreneur"), ("Lisa Park", "lisap_creator"),
            ("Tom Brown", "tomb_ecommerce"), ("Nina Garcia", "ninag_productivity")
        ]
        
        leads = []
        for i in range(min(count, len(mock_users))):
            name, username = mock_users[i]
            keyword = keywords[i % len(keywords)]
            
            leads.append({
                "name": name,
                "username": username,
                "profile_url": f"https://twitter.com/{username}",
                "source": LeadSource.TWITTER,
                "context": {
                    "tweet_content": f"Anyone have experience with {keyword}? Looking to learn more...",
                    "followers_count": 1500 + (i * 100),
                    "bio": f"Entrepreneur | {keyword} enthusiast | Building the future"
                }
            })
        
        logger.info(f"Generated {len(leads)} mock Twitter leads")
        return leads
    
    def _generate_mock_discord_leads(self, server_ids: List[str], count: int) -> List[Dict[str, Any]]:
        """Generate mock Discord leads for development/testing"""
        
        mock_users = [
            "CodeMaster", "DesignPro", "MarketingWiz", "StartupHero",
            "TechGuru", "CreativeGenius", "BusinessMind", "GrowthHacker"
        ]
        
        leads = []
        for i in range(min(count, len(mock_users))):
            username = mock_users[i]
            server_id = server_ids[i % len(server_ids)] if server_ids else "mock_server"
            
            leads.append({
                "name": None,
                "username": username,
                "profile_url": None,  # Discord doesn't have public profile URLs
                "source": LeadSource.DISCORD,
                "context": {
                    "server_id": server_id,
                    "message_content": "Has anyone tried building a community around...",
                    "message_count": 25 + i,
                    "join_date": "2023-01-01"
                }
            })
        
        logger.info(f"Generated {len(leads)} mock Discord leads")
        return leads