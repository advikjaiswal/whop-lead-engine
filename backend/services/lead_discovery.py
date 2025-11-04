import asyncio
import re
import httpx
import openai
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from loguru import logger
from config.settings import get_settings

settings = get_settings()


class LeadDiscoveryService:
    def __init__(self, openai_api_key: str):
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        self.reddit_headers = {
            'User-Agent': 'WhopLeadEngine/1.0'
        }
    
    async def discover_leads(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Main method to discover leads based on user criteria"""
        
        logger.info(f"Starting lead discovery with criteria: {criteria}")
        
        leads = []
        
        # Discover leads from multiple sources in parallel
        tasks = [
            self._discover_reddit_leads(criteria),
            self._discover_twitter_leads(criteria),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Error in lead discovery: {result}")
            elif isinstance(result, list):
                leads.extend(result)
        
        # Filter and score leads
        qualified_leads = await self._qualify_and_score_leads(leads, criteria)
        
        logger.info(f"Discovered {len(qualified_leads)} qualified leads")
        return qualified_leads
    
    async def _discover_reddit_leads(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Discover leads from Reddit based on keywords and subreddits"""
        
        leads = []
        keywords = criteria.get('keywords', [])
        subreddits = criteria.get('subreddits', ['entrepreneur', 'startups', 'SaaS', 'business'])
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                for subreddit in subreddits:
                    for keyword in keywords:
                        # Search Reddit posts
                        search_url = f"https://www.reddit.com/r/{subreddit}/search.json"
                        params = {
                            'q': keyword,
                            'sort': 'new',
                            'limit': 25,
                            't': 'week'  # Last week
                        }
                        
                        try:
                            response = await client.get(
                                search_url, 
                                headers=self.reddit_headers,
                                params=params
                            )
                            
                            if response.status_code == 200:
                                data = response.json()
                                posts = data.get('data', {}).get('children', [])
                                
                                for post_data in posts:
                                    post = post_data.get('data', {})
                                    lead = self._extract_reddit_lead(post, subreddit, keyword)
                                    if lead:
                                        leads.append(lead)
                                        
                        except Exception as e:
                            logger.warning(f"Error fetching Reddit data for r/{subreddit}: {e}")
                            continue
                
        except Exception as e:
            logger.error(f"Error in Reddit lead discovery: {e}")
        
        return leads
    
    async def _discover_twitter_leads(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Discover leads from Twitter based on keywords"""
        
        leads = []
        keywords = criteria.get('keywords', [])
        
        # Note: This would require Twitter API v2 access
        # For now, we'll create a placeholder structure
        
        try:
            # Simulate Twitter API call structure
            for keyword in keywords:
                # In a real implementation, you would:
                # 1. Use Twitter API v2 to search tweets
                # 2. Filter by engagement, recency, language
                # 3. Extract user profiles and tweet content
                
                # Placeholder for Twitter leads (would be replaced with actual API calls)
                logger.info(f"Would search Twitter for keyword: {keyword}")
                
        except Exception as e:
            logger.error(f"Error in Twitter lead discovery: {e}")
        
        return leads
    
    def _extract_reddit_lead(self, post: Dict, subreddit: str, keyword: str) -> Optional[Dict[str, Any]]:
        """Extract lead information from Reddit post"""
        
        try:
            # Skip if post is too old or deleted
            if not post.get('selftext') and not post.get('title'):
                return None
            
            # Skip if author is deleted or bot
            author = post.get('author', '')
            if author in ['[deleted]', 'AutoModerator'] or 'bot' in author.lower():
                return None
            
            # Combine title and content
            content = f"{post.get('title', '')} {post.get('selftext', '')}".strip()
            
            # Skip very short posts
            if len(content) < 50:
                return None
            
            created_utc = post.get('created_utc', 0)
            created_date = datetime.fromtimestamp(created_utc) if created_utc else datetime.now()
            
            return {
                'id': f"reddit_{post.get('id', '')}",
                'name': author,
                'username': author,
                'source': 'reddit',
                'content': content,
                'url': f"https://reddit.com{post.get('permalink', '')}",
                'platform_data': {
                    'subreddit': subreddit,
                    'upvotes': post.get('ups', 0),
                    'comments': post.get('num_comments', 0),
                    'keyword_matched': keyword
                },
                'discovered_at': created_date,
                'raw_score': post.get('score', 0)
            }
            
        except Exception as e:
            logger.warning(f"Error extracting Reddit lead: {e}")
            return None
    
    async def _qualify_and_score_leads(self, leads: List[Dict[str, Any]], criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Use AI to qualify and score leads based on intent and quality"""
        
        qualified_leads = []
        
        for lead in leads:
            try:
                # Analyze content with OpenAI
                analysis = await self._analyze_content_with_ai(lead['content'], criteria)
                
                if analysis and analysis.get('is_qualified', False):
                    # Add AI analysis to lead
                    lead.update({
                        'intent_score': analysis.get('intent_score', 0.0),
                        'quality_grade': analysis.get('quality_grade', 'D'),
                        'interests': analysis.get('interests', []),
                        'pain_points': analysis.get('pain_points', []),
                        'summary': analysis.get('summary', ''),
                        'personalization_data': analysis.get('personalization_data', {}),
                        'status': 'new',
                        'created_at': datetime.now(),
                        'updated_at': datetime.now()
                    })
                    
                    qualified_leads.append(lead)
                    
            except Exception as e:
                logger.warning(f"Error qualifying lead {lead.get('id')}: {e}")
                continue
        
        # Sort by intent score (highest first)
        qualified_leads.sort(key=lambda x: x.get('intent_score', 0), reverse=True)
        
        return qualified_leads
    
    async def _analyze_content_with_ai(self, content: str, criteria: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Analyze content using OpenAI to determine lead quality and intent"""
        
        try:
            community_niche = criteria.get('niche', 'general business')
            target_keywords = criteria.get('keywords', [])
            
            prompt = f"""
Analyze this social media content to determine if this person would be a good lead for a {community_niche} community.

Content: "{content}"

Target Keywords: {', '.join(target_keywords)}
Community Niche: {community_niche}

Analyze and respond with a JSON object containing:
1. "is_qualified": boolean - Is this a qualified lead?
2. "intent_score": float 0-1 - How likely are they to be interested?
3. "quality_grade": string A-D - Overall lead quality
4. "interests": array of strings - What are their interests?
5. "pain_points": array of strings - What problems do they have?
6. "summary": string - Brief summary of why they're a good/bad lead
7. "personalization_data": object with:
   - "recommended_approach": string - How to approach them
   - "key_talking_points": array of strings
   - "urgency_level": string low/medium/high

Focus on:
- Do they express problems our community can solve?
- Are they actively seeking solutions?
- Do they show willingness to invest in solutions?
- Is their content recent and genuine?

Only qualify leads with clear intent and relevant problems.
"""

            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            content_text = response.choices[0].message.content
            
            # Try to parse JSON from response
            import json
            try:
                # Extract JSON from response if it contains other text
                json_start = content_text.find('{')
                json_end = content_text.rfind('}') + 1
                if json_start != -1 and json_end != -1:
                    json_str = content_text[json_start:json_end]
                    analysis = json.loads(json_str)
                    return analysis
                else:
                    logger.warning("No JSON found in AI response")
                    return None
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse AI response as JSON: {e}")
                return None
                
        except Exception as e:
            logger.error(f"Error in AI content analysis: {e}")
            return None


class LeadCriteriaService:
    """Service to manage user lead discovery criteria"""
    
    @staticmethod
    def get_default_criteria(niche: str) -> Dict[str, Any]:
        """Get default criteria based on community niche"""
        
        criteria_templates = {
            'trading': {
                'keywords': ['learn trading', 'trading strategy', 'forex help', 'stock market', 'day trading', 'crypto trading'],
                'subreddits': ['trading', 'forex', 'stocks', 'cryptocurrency', 'investing', 'SecurityAnalysis'],
                'pain_points': ['losing money', 'need strategy', 'market analysis', 'risk management'],
                'target_demographic': 'traders and investors seeking education'
            },
            'saas': {
                'keywords': ['build saas', 'software startup', 'app development', 'tech stack', 'mvp development'],
                'subreddits': ['startups', 'SaaS', 'entrepreneur', 'webdev', 'programming'],
                'pain_points': ['need technical help', 'struggling with development', 'finding customers'],
                'target_demographic': 'aspiring SaaS founders and developers'
            },
            'fitness': {
                'keywords': ['lose weight', 'workout plan', 'fitness coach', 'nutrition help', 'gym routine'],
                'subreddits': ['fitness', 'loseit', 'bodybuilding', 'nutrition', 'workout'],
                'pain_points': ['not seeing results', 'need motivation', 'diet struggles', 'exercise form'],
                'target_demographic': 'people seeking fitness and health improvement'
            },
            'marketing': {
                'keywords': ['digital marketing', 'grow business', 'social media marketing', 'lead generation', 'online sales'],
                'subreddits': ['marketing', 'entrepreneur', 'business', 'socialmedia', 'startups'],
                'pain_points': ['low traffic', 'poor conversion', 'marketing strategy', 'customer acquisition'],
                'target_demographic': 'business owners needing marketing help'
            }
        }
        
        return criteria_templates.get(niche, {
            'keywords': ['business help', 'entrepreneurship', 'startup advice'],
            'subreddits': ['entrepreneur', 'business', 'startups'],
            'pain_points': ['need guidance', 'business struggles'],
            'target_demographic': 'general business community'
        })
    
    @staticmethod
    def validate_criteria(criteria: Dict[str, Any]) -> bool:
        """Validate user-provided criteria"""
        
        required_fields = ['keywords', 'niche']
        
        for field in required_fields:
            if field not in criteria:
                return False
        
        if not isinstance(criteria['keywords'], list) or len(criteria['keywords']) == 0:
            return False
        
        return True