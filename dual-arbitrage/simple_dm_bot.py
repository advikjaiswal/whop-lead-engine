import praw
import requests
import time
import json
import os
import random
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
# --- CONFIGURATION ---
TARGET_SUBREDDITS = [
    "HomeImprovement", "Homeowners", "DIY", "FixIt", 
    "Renovations", "Roofing", "InteriorDesign", "Detroit"
]

SEARCH_KEYWORDS = [
    "renovation", "remodel", "roof", "kitchen", "bath", "basement", 
    "contractor", "quote", "estimate", "cost", "budget", 
    "detroit", "michigan", "repair", "fix"
]

# Max age of posts to target (in days)
MAX_POST_AGE_DAYS = 3

# --- MESSAGE TEMPLATES ---
def get_message_template(username, subreddit, title, is_detroit=False):
    """Generate a personalized message based on context"""
    
    if is_detroit:
        return f"""Hi {username},

I saw your post in r/{subreddit} about "{title}". I'm actually helping homeowners in the Detroit area specifically with renovations and repairs right now.

We have a few slots open for free estimates this week (roofing, remodeling, general fixes). 

If you're still looking for a reliable quote, what's the best number to text you at? I can have someone reach out in about 5 mins to get the details.

Best,
AJ"""

    else:
        return f"""Hi {username},

I came across your post in r/{subreddit} regarding "{title}". It sounds like you're planning some work on your home.

I work with a network of top-rated contractors who specialize in exactly this kind of project (budgets from $10k-$100k). We're currently offering free, detailed project estimates to help homeowners plan their renovations.

Would you be open to a quick chat? If so, what's the best phone number to reach you at? I can send over some info.

Cheers,
AJ"""

MAX_DMS_PER_RUN = 1000 
DELAY_MIN = 45    # 45 seconds
DELAY_MAX = 120   # 2 minutes
COFFEE_BREAK_INTERVAL = 10 # Take a break every 10 DMs
COFFEE_BREAK_DURATION = 300 # 5 minutes
TRACKING_FILE = "sent_dms.json"
TRACKING_FILE = "sent_dms.json"

# --- SETUP ---
def setup_reddit():
    """Initialize Reddit API client"""
    try:
        reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            username=os.getenv("REDDIT_USERNAME"),
            password=os.getenv("REDDIT_PASSWORD"),
            user_agent="SimpleDMBot/1.0"
        )
        print(f"✅ Authenticated as: {reddit.user.me()}")
        return reddit
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        print("Please check your .env file credentials.")
        return None

def load_sent_history():
    """Load history of sent DMs to avoid duplicates"""
    if os.path.exists(TRACKING_FILE):
        try:
            with open(TRACKING_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_sent_history(history):
    """Save sent DM history"""
    with open(TRACKING_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def load_proxies():
    """Load proxies from proxies.txt"""
    proxies = []
    if os.path.exists("proxies.txt"):
        with open("proxies.txt", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    proxies.append(line)
    return proxies

def rotate_proxy(reddit, proxy):
    """Rotate the proxy used by the Reddit instance"""
    if not proxy:
        return
    
    print(f"🔄 Rotating proxy to: {proxy}")
    try:
        # PRAW uses a requests.Session object internally
        # We can access it via reddit._core._requestor._http
        # This is internal API usage, but necessary for dynamic proxy switching without recreating the Reddit object
        session = reddit._core._requestor._http
        
        # Configure proxies for both HTTP and HTTPS
        session.proxies = {
            "http": proxy,
            "https": proxy
        }
    except Exception as e:
        print(f"❌ Failed to rotate proxy: {e}")

def main():
    print("🚀 Starting Simple Reddit DM Bot...")
    
    reddit = setup_reddit()
    if not reddit:
        return

    sent_history = load_sent_history()
    dms_sent_count = 0
    
    print(f"📂 Loaded {len(sent_history)} previous interactions.")
    print(f"🎯 Target Subreddits: {', '.join(TARGET_SUBREDDITS)}")
    print(f"🔢 Target DMs: {MAX_DMS_PER_RUN}")

    proxies = load_proxies()
    current_proxy_index = 0
    
    if proxies:
        print(f"🌍 Loaded {len(proxies)} proxies.")
        # Set initial proxy
        rotate_proxy(reddit, proxies[current_proxy_index])
    else:
        print("⚠️  No proxies found in proxies.txt. Running without proxies.")

    try:
        # Iterate through multiple subreddits
        # We'll shuffle them or just loop through all
        for sub_name in TARGET_SUBREDDITS:
            if dms_sent_count >= MAX_DMS_PER_RUN:
                break
                
            print(f"🔎 Scanning r/{sub_name}...")
            subreddit = reddit.subreddit(sub_name)
            
            # Fetch new posts
            try:
                posts = list(subreddit.new(limit=50)) # Fetch 50 from each to keep it fresh
            except Exception as e:
                print(f"⚠️ Could not fetch from r/{sub_name}: {e}")
                continue

            for post in posts:
                if dms_sent_count >= MAX_DMS_PER_RUN:
                    print("🛑 Reached max DMs for this run.")
                    break

                
            author = post.author
            
            # Skip if author is deleted or None
            if not author:
                continue
                
            username = author.name
            
            # Skip if already messaged
            if username in sent_history:
                continue
            
            # Check post age
            post_age_days = (datetime.now().timestamp() - post.created_utc) / (24 * 3600)
            if post_age_days > MAX_POST_AGE_DAYS:
                # print(f"  - Old post ({post_age_days:.1f} days). Skipping.")
                continue

            # Filter by keywords
            if not any(keyword in post.title.lower() or keyword in post.selftext.lower() for keyword in SEARCH_KEYWORDS):
                # print(f"  - No keywords match. Skipping.")
                continue

            try:
                # Determine if it's a Detroit-specific context
                is_detroit = "detroit" in post.title.lower() or sub_name.lower() == "detroit"
                
                # Generate message
                message_body = get_message_template(
                    username=username,
                    subreddit=sub_name,
                    title=post.title[:50] + "..." if len(post.title) > 50 else post.title,
                    is_detroit=is_detroit
                )
                
                # Send DM
                print(f"📨 Sending DM to u/{username} (r/{sub_name})...")
                reddit.redditor(username).message(subject="Quick question about your project", message=message_body)
                
                # Update history
                sent_history[username] = {
                    "timestamp": datetime.now().isoformat(),
                    "post_id": post.id,
                    "subreddit": sub_name
                }
                save_sent_history(sent_history)
                
                dms_sent_count += 1
                print(f"✅ Sent! Total: {dms_sent_count}/{MAX_DMS_PER_RUN}")

                # Rotate proxy every 10 DMs
                if proxies and dms_sent_count % 10 == 0:
                    current_proxy_index = (current_proxy_index + 1) % len(proxies)
                    rotate_proxy(reddit, proxies[current_proxy_index])
                
                # Smart Rate Limiting
                
                # 1. Coffee Break
                if dms_sent_count % COFFEE_BREAK_INTERVAL == 0:
                    print(f"☕ Taking a coffee break for {COFFEE_BREAK_DURATION/60:.0f} minutes to mimic human behavior...")
                    time.sleep(COFFEE_BREAK_DURATION)
                else:
                    # 2. Standard Random Delay
                    delay = random.randint(DELAY_MIN, DELAY_MAX)
                    print(f"⏳ Sleeping for {delay} seconds...")
                    time.sleep(delay)
                
            except Exception as e:
                print(f"❌ Failed to send to u/{username}: {e}")
                # If we hit a rate limit error specifically, we might want to sleep longer
                if "RATELIMIT" in str(e).upper():
                    print("⚠️  Reddit Rate Limit hit. Sleeping for 10 minutes...")
                    time.sleep(600)
                    # Try rotating proxy after rate limit
                    if proxies:
                        print("🔄 Rotating proxy due to rate limit...")
                        current_proxy_index = (current_proxy_index + 1) % len(proxies)
                        rotate_proxy(reddit, proxies[current_proxy_index])
                else:
                    # Mark as 'failed' so we don't retry immediately if it's a persistent error? 
                    # Or just skip for now.
                    pass

    except KeyboardInterrupt:
        print("\n🛑 Bot stopped by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    
    print(f"\n🏁 Run complete. Sent {dms_sent_count} DMs.")

if __name__ == "__main__":
    main()
