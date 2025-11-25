import httpx
import asyncio
import re
from typing import List

async def discover_reddit_leads(keywords: List[str], subreddits: List[str], max_leads: int = 10):
    """Real Reddit lead discovery using the Reddit API"""
    leads = []
    
    if not keywords or not subreddits:
        return []
    
    max_leads = min(max_leads, 50)
    
    timeout_config = httpx.Timeout(10.0)
    
    async with httpx.AsyncClient(timeout=timeout_config) as client:
        for subreddit in subreddits[:10]:
            try:
                clean_subreddit = re.sub(r'[^a-zA-Z0-9_]', '', subreddit)
                if not clean_subreddit:
                    continue
                
                url = f"https://www.reddit.com/r/{clean_subreddit}/search.json"
                params = {
                    "q": " OR ".join([kw for kw in keywords[:10] if kw.strip()]),
                    "sort": "new",
                    "limit": min(max_leads * 2, 25),
                    "t": "week",
                    "restrict_sr": "true"
                }
                headers = {
                    "User-Agent": "WhopLeadEngine/1.0 (Educational Research Tool)",
                    "Accept": "application/json"
                }
                
                response = await client.get(url, params=params, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    posts = data.get("data", {}).get("children", [])
                    if not posts:
                        print(f"No posts found in r/{clean_subreddit}")
                        continue
                    
                    for post in posts:
                        if len(leads) >= max_leads:
                            break
                        
                        post_data = post.get("data", {})
                        
                        if post_data.get("author") in ["[deleted]", "[removed]", None]:
                            continue
                        
                        title = post_data.get("title", "").strip()
                        content = post_data.get("selftext", "").strip()
                        
                        if not title and not content:
                            continue
                        
                        score = max(0, post_data.get("score", 0))
                        comments = max(0, post_data.get("num_comments", 0))
                        upvote_ratio = post_data.get("upvote_ratio", 0.5)
                        
                        quality_score = (score * 0.3 + comments * 0.5 + upvote_ratio * 20) / 10
                        quality_score = min(max(quality_score, 0), 10.0)
                        
                        text = f"{title} {content}".lower()
                        sentiment = "neutral"
                        
                        negative_words = ["help", "need", "problem", "struggling", "issue", "broken", "failing", "stuck"]
                        positive_words = ["success", "great", "amazing", "fantastic", "working", "solved", "achieved"]
                        
                        if any(word in text for word in negative_words):
                            sentiment = "negative"
                        elif any(word in text for word in positive_words):
                            sentiment = "positive"
                        
                        matched_keywords = [kw for kw in keywords if kw.lower() in text]
                        
                        lead = {
                            "title": title[:200],
                            "content": content[:500],
                            "author": post_data.get("author", "unknown"),
                            "source_url": f"https://reddit.com{post_data.get('permalink', '')}",
                            "subreddit": clean_subreddit,
                            "quality_score": round(quality_score, 2),
                            "sentiment": sentiment,
                            "keywords_matched": ", ".join(matched_keywords[:5])
                        }
                        leads.append(lead)
                
                elif response.status_code == 429:
                    print(f"Rate limited by Reddit for r/{clean_subreddit}")
                    await asyncio.sleep(2)
                    continue
                elif response.status_code == 403:
                    print(f"Access forbidden for r/{clean_subreddit}")
                    continue
                else:
                    print(f"Reddit API error for r/{clean_subreddit}: {response.status_code}")
                    continue
                
                await asyncio.sleep(0.5)
                
            except asyncio.TimeoutError:
                print(f"Timeout fetching from r/{subreddit}")
                continue
            except Exception as e:
                print(f"Error fetching from r/{subreddit}: {e}")
                continue
    
    print(f"Discovered {len(leads)} leads from {len(subreddits)} subreddits")
    return leads[:max_leads]
