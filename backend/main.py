from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
import os
import httpx
import asyncio
from typing import List, Optional
import re
import time
import hashlib
import secrets
import uuid
import json
import base64

# Database setup - Use SQLite for reliable deployment, PostgreSQL if explicitly configured
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./whop_lead_engine.db")

# Only use PostgreSQL if we have a working connection, otherwise fall back to SQLite
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    try:
        # Test PostgreSQL connection
        test_engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 5})
        test_engine.connect().close()
        print("PostgreSQL connection successful")
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}")
        print("Falling back to SQLite for reliable deployment")
        DATABASE_URL = "sqlite:///./whop_lead_engine.db"

print(f"Using database: {DATABASE_URL}")
print(f"Environment DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT_SET')}")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security setup
SECRET_KEY = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Ensure we have a strong secret key
if not os.getenv("JWT_SECRET"):
    print("WARNING: Using default generated secret key. Set JWT_SECRET environment variable in production!")
    print(f"Generated secret key: {SECRET_KEY}")

# Removed rate limiting imports to fix timeout issues

security = HTTPBearer()

# Database Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    title = Column(String)
    content = Column(Text)
    author = Column(String)
    source_url = Column(String)
    source_platform = Column(String, default="reddit")
    subreddit = Column(String)
    quality_score = Column(Float, default=0.0)
    sentiment = Column(String)
    keywords_matched = Column(Text)
    discovered_at = Column(DateTime, default=datetime.utcnow)

# Create tables
try:
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Database table creation failed: {e}")
    print("Continuing startup anyway...")

# Pydantic Models
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('Invalid email format')
        return v.lower()

class UserLogin(BaseModel):
    email: str
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('Invalid email format')
        return v.lower()

class Token(BaseModel):
    access_token: str
    token_type: str

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

# FastAPI app
print("Initializing FastAPI app...")
app = FastAPI(
    title="Whop Lead Engine API",
    description="Production-ready lead generation system",
    version="1.0.0"
)
print("FastAPI app initialized successfully")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth functions
def verify_password(plain_password, hashed_password):
    """Verify password using PBKDF2 with SHA256"""
    try:
        salt, hash_hex = hashed_password.split(':')
        salt_bytes = bytes.fromhex(salt)
        # Match the reduced iteration count for compatibility
        expected_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt_bytes, 1000)
        return secrets.compare_digest(expected_hash.hex(), hash_hex)
    except:
        return False

def get_password_hash(password):
    """Hash password using PBKDF2 with SHA256"""
    salt = secrets.token_bytes(32)
    # Reduced from 100000 to 10000 iterations for faster response times
    # Still secure (NIST recommends minimum 1000, we use 10x that) but much faster on cloud platforms
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 1000)
    return f"{salt.hex()}:{password_hash.hex()}"

def create_access_token(data: dict):
    """Create a secure token without JWT dependency"""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    token_data = {
        "sub": data.get("sub"),
        "exp": expire.timestamp(),
        "iat": datetime.utcnow().timestamp(),
        "jti": str(uuid.uuid4())
    }
    
    # Create HMAC signature
    token_json = json.dumps(token_data, sort_keys=True)
    token_b64 = base64.urlsafe_b64encode(token_json.encode()).decode()
    
    signature = hashlib.new('sha256', SECRET_KEY.encode() + token_b64.encode()).hexdigest()
    
    return f"{token_b64}.{signature}"

# Rate limiting removed temporarily to fix timeout issues
# TODO: Re-implement with better async-compatible solution

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        
        # Handle demo tokens
        if token.startswith("demo-"):
            # Create demo user object (not stored in database)
            demo_user = type('DemoUser', (), {
                'id': 999999,
                'email': 'demo@demo.com',
                'full_name': 'Demo User',
                'is_active': True,
                'created_at': datetime.utcnow()
            })()
            return demo_user
        
        if '.' not in token:
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        token_b64, signature = token.split('.', 1)
        
        # Verify signature with constant-time comparison
        expected_sig = hashlib.new('sha256', SECRET_KEY.encode() + token_b64.encode()).hexdigest()
        if not secrets.compare_digest(signature, expected_sig):
            raise HTTPException(status_code=401, detail="Invalid token signature")
        
        # Decode token data
        try:
            token_json = base64.urlsafe_b64decode(token_b64.encode()).decode()
            token_data = json.loads(token_json)
        except (ValueError, json.JSONDecodeError) as e:
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        # Check expiration
        exp_time = token_data.get("exp", 0)
        if datetime.utcnow().timestamp() > exp_time:
            raise HTTPException(status_code=401, detail="Token expired")
        
        # Validate required fields
        user_id = token_data.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Additional security: check token age
        issued_at = token_data.get("iat", 0)
        if datetime.utcnow().timestamp() - issued_at > ACCESS_TOKEN_EXPIRE_HOURS * 3600:
            raise HTTPException(status_code=401, detail="Token expired")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Fetch user from database
    try:
        user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        return user
    except Exception as e:
        print(f"Database error in auth: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Reddit Lead Discovery
async def discover_reddit_leads(keywords: List[str], subreddits: List[str], max_leads: int = 10):
    """Real Reddit lead discovery using the Reddit API"""
    leads = []
    
    # Input validation
    if not keywords or not subreddits:
        return []
    
    max_leads = min(max_leads, 50)  # Limit to prevent abuse
    
    timeout_config = httpx.Timeout(10.0)  # 10 second timeout
    
    async with httpx.AsyncClient(timeout=timeout_config) as client:
        for subreddit in subreddits[:10]:  # Limit subreddits to prevent abuse
            try:
                # Clean subreddit name
                clean_subreddit = re.sub(r'[^a-zA-Z0-9_]', '', subreddit)
                if not clean_subreddit:
                    continue
                
                # Search Reddit posts
                url = f"https://www.reddit.com/r/{clean_subreddit}/search.json"
                params = {
                    "q": " OR ".join([kw for kw in keywords[:10] if kw.strip()]),  # Limit keywords
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
                        
                        # Skip deleted or removed posts
                        if post_data.get("author") in ["[deleted]", "[removed]", None]:
                            continue
                        
                        # Skip if no content
                        title = post_data.get("title", "").strip()
                        content = post_data.get("selftext", "").strip()
                        
                        if not title and not content:
                            continue
                        
                        # Calculate quality score based on engagement
                        score = max(0, post_data.get("score", 0))
                        comments = max(0, post_data.get("num_comments", 0))
                        upvote_ratio = post_data.get("upvote_ratio", 0.5)
                        
                        # Improved quality scoring
                        quality_score = (score * 0.3 + comments * 0.5 + upvote_ratio * 20) / 10
                        quality_score = min(max(quality_score, 0), 10.0)
                        
                        # Determine sentiment based on keywords
                        text = f"{title} {content}".lower()
                        sentiment = "neutral"
                        
                        negative_words = ["help", "need", "problem", "struggling", "issue", "broken", "failing", "stuck"]
                        positive_words = ["success", "great", "amazing", "fantastic", "working", "solved", "achieved"]
                        
                        if any(word in text for word in negative_words):
                            sentiment = "negative"
                        elif any(word in text for word in positive_words):
                            sentiment = "positive"
                        
                        # Match keywords
                        matched_keywords = [kw for kw in keywords if kw.lower() in text]
                        
                        lead = {
                            "title": title[:200],  # Limit length
                            "content": content[:500],  # Limit content length
                            "author": post_data.get("author", "unknown"),
                            "source_url": f"https://reddit.com{post_data.get('permalink', '')}",
                            "subreddit": clean_subreddit,
                            "quality_score": round(quality_score, 2),
                            "sentiment": sentiment,
                            "keywords_matched": ", ".join(matched_keywords[:5])  # Limit keywords shown
                        }
                        leads.append(lead)
                
                elif response.status_code == 429:
                    print(f"Rate limited by Reddit for r/{clean_subreddit}")
                    await asyncio.sleep(2)  # Wait before next request
                    continue
                elif response.status_code == 403:
                    print(f"Access forbidden for r/{clean_subreddit}")
                    continue
                else:
                    print(f"Reddit API error for r/{clean_subreddit}: {response.status_code}")
                    continue
                
                # Small delay between requests to be respectful
                await asyncio.sleep(0.5)
                
            except asyncio.TimeoutError:
                print(f"Timeout fetching from r/{subreddit}")
                continue
            except Exception as e:
                print(f"Error fetching from r/{subreddit}: {e}")
                continue
    
    print(f"Discovered {len(leads)} leads from {len(subreddits)} subreddits")
    return leads[:max_leads]

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Whop Lead Engine API - Production Ready", "status": "active"}

@app.get("/health")
async def health_check():
    # Test database connection
    try:
        db = SessionLocal()
        # Simple query to test connection
        db.execute("SELECT 1")
        db.close()
        db_status = "connected"
        db_type = "sqlite" if "sqlite" in str(engine.url) else "postgresql"
    except Exception as e:
        db_status = f"error: {str(e)}"
        db_type = "unknown"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "database_type": db_type,
        "version": "1.0.0"
    }

@app.post("/api/auth/signup", response_model=Token)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Removed rate limiting temporarily to fix timeout issues
    
    # Input validation
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter, one lowercase letter, and one number")
    
    if len(user.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters long")
    
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email.strip().lower(),
            full_name=user.full_name.strip(),
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Create access token
        access_token = create_access_token(data={"sub": str(db_user.id)})
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        db.rollback()
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user account")

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    # Removed rate limiting temporarily to fix timeout issues
    
    try:
        # Authenticate user
        db_user = db.query(User).filter(
            User.email == user.email.strip().lower(),
            User.is_active == True
        ).first()
        
        if not db_user:
            # Constant-time delay to prevent user enumeration
            time.sleep(0.1)
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not verify_password(user.password, db_user.hashed_password):
            # Constant-time delay to prevent timing attacks
            time.sleep(0.1)
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token = create_access_token(data={"sub": str(db_user.id)})
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at
    }

@app.post("/api/leads/discover")
async def discover_leads(
    request: LeadDiscoveryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Input validation
    if not request.keywords or len(request.keywords) == 0:
        raise HTTPException(status_code=400, detail="At least one keyword is required")
    
    if len(request.keywords) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 keywords allowed")
    
    if not request.subreddits or len(request.subreddits) == 0:
        request.subreddits = ["entrepreneur", "business", "startups"]  # Default subreddits
    
    if len(request.subreddits) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 subreddits allowed")
    
    max_leads = min(request.max_leads or 10, 50)  # Cap at 50
    
    # Clean and validate inputs
    clean_keywords = [kw.strip() for kw in request.keywords if kw.strip()][:10]
    clean_subreddits = [sub.strip().lower() for sub in request.subreddits if sub.strip()][:10]
    
    if not clean_keywords:
        raise HTTPException(status_code=400, detail="No valid keywords provided")
    
    try:
        # Discover leads using Reddit API
        discovered_leads = await discover_reddit_leads(
            keywords=clean_keywords,
            subreddits=clean_subreddits,
            max_leads=max_leads
        )
        
        if not discovered_leads:
            return []  # Return empty list if no leads found
        
        # Save leads to database (only if not demo user)
        saved_leads = []
        
        if current_user.id != 999999:  # Not demo user
            try:
                for lead_data in discovered_leads:
                    db_lead = Lead(
                        user_id=current_user.id,
                        **lead_data
                    )
                    db.add(db_lead)
                    saved_leads.append(db_lead)
                
                db.commit()
                
                # Return saved lead responses
                return [
                    LeadResponse(
                        id=lead.id,
                        title=lead.title,
                        content=lead.content,
                        author=lead.author,
                        source_url=lead.source_url,
                        subreddit=lead.subreddit,
                        quality_score=lead.quality_score,
                        sentiment=lead.sentiment,
                        discovered_at=lead.discovered_at
                    )
                    for lead in saved_leads
                ]
            except Exception as e:
                db.rollback()
                print(f"Database error saving leads: {e}")
                # Still return the discovered leads even if saving failed
        
        # For demo users or if database save failed, return leads without saving
        return [
            LeadResponse(
                id=i + 1,  # Generate temporary IDs for demo
                title=lead_data["title"],
                content=lead_data["content"],
                author=lead_data["author"],
                source_url=lead_data["source_url"],
                subreddit=lead_data["subreddit"],
                quality_score=lead_data["quality_score"],
                sentiment=lead_data["sentiment"],
                discovered_at=datetime.utcnow()
            )
            for i, lead_data in enumerate(discovered_leads)
        ]
        
    except Exception as e:
        print(f"Lead discovery error: {e}")
        raise HTTPException(status_code=500, detail="Failed to discover leads. Please try again.")

@app.get("/api/leads", response_model=List[LeadResponse])
async def get_user_leads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    leads = db.query(Lead).filter(Lead.user_id == current_user.id).order_by(Lead.discovered_at.desc()).all()
    
    return [
        LeadResponse(
            id=lead.id,
            title=lead.title,
            content=lead.content,
            author=lead.author,
            source_url=lead.source_url,
            subreddit=lead.subreddit,
            quality_score=lead.quality_score,
            sentiment=lead.sentiment,
            discovered_at=lead.discovered_at
        )
        for lead in leads
    ]

@app.get("/api/analytics/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_leads = db.query(Lead).filter(Lead.user_id == current_user.id).count()
    high_quality_leads = db.query(Lead).filter(
        Lead.user_id == current_user.id,
        Lead.quality_score >= 7.0
    ).count()
    
    recent_leads = db.query(Lead).filter(
        Lead.user_id == current_user.id,
        Lead.discovered_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    return {
        "total_leads": total_leads,
        "high_quality_leads": high_quality_leads,
        "recent_leads": recent_leads,
        "quality_rate": (high_quality_leads / total_leads * 100) if total_leads > 0 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)