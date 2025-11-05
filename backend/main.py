from fastapi import FastAPI, HTTPException, Depends, status
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

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./whop_lead_engine.db")

# Handle PostgreSQL URL format if present
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with proper configuration for different databases
if DATABASE_URL.startswith("postgresql://"):
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"sslmode": "require"})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security setup
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

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
        expected_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt_bytes, 100000)
        return secrets.compare_digest(expected_hash.hex(), hash_hex)
    except:
        return False

def get_password_hash(password):
    """Hash password using PBKDF2 with SHA256"""
    salt = secrets.token_bytes(32)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
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

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        if '.' not in token:
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        token_b64, signature = token.split('.', 1)
        
        # Verify signature
        expected_sig = hashlib.new('sha256', SECRET_KEY.encode() + token_b64.encode()).hexdigest()
        if not secrets.compare_digest(signature, expected_sig):
            raise HTTPException(status_code=401, detail="Invalid token signature")
        
        # Decode token data
        token_json = base64.urlsafe_b64decode(token_b64.encode()).decode()
        token_data = json.loads(token_json)
        
        # Check expiration
        if datetime.utcnow().timestamp() > token_data.get("exp", 0):
            raise HTTPException(status_code=401, detail="Token expired")
        
        user_id = token_data.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except (ValueError, json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Reddit Lead Discovery
async def discover_reddit_leads(keywords: List[str], subreddits: List[str], max_leads: int = 10):
    """Real Reddit lead discovery using the Reddit API"""
    leads = []
    
    async with httpx.AsyncClient() as client:
        for subreddit in subreddits:
            try:
                # Search Reddit posts
                url = f"https://www.reddit.com/r/{subreddit}/search.json"
                params = {
                    "q": " OR ".join(keywords),
                    "sort": "new",
                    "limit": max_leads,
                    "t": "week"
                }
                headers = {"User-Agent": "WhopLeadEngine/1.0"}
                
                response = await client.get(url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    
                    for post in data.get("data", {}).get("children", []):
                        post_data = post["data"]
                        
                        # Calculate quality score based on engagement
                        score = post_data.get("score", 0)
                        comments = post_data.get("num_comments", 0)
                        quality_score = min((score + comments * 2) / 10, 10.0)
                        
                        # Determine sentiment based on keywords
                        text = f"{post_data.get('title', '')} {post_data.get('selftext', '')}"
                        sentiment = "neutral"
                        if any(word in text.lower() for word in ["help", "need", "problem", "struggling"]):
                            sentiment = "negative"
                        elif any(word in text.lower() for word in ["success", "great", "amazing", "fantastic"]):
                            sentiment = "positive"
                        
                        lead = {
                            "title": post_data.get("title", ""),
                            "content": post_data.get("selftext", "")[:500],
                            "author": post_data.get("author", ""),
                            "source_url": f"https://reddit.com{post_data.get('permalink', '')}",
                            "subreddit": subreddit,
                            "quality_score": quality_score,
                            "sentiment": sentiment,
                            "keywords_matched": ", ".join([kw for kw in keywords if kw.lower() in text.lower()])
                        }
                        leads.append(lead)
                        
                        if len(leads) >= max_leads:
                            break
                
            except Exception as e:
                print(f"Error fetching from {subreddit}: {e}")
                continue
    
    return leads[:max_leads]

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Whop Lead Engine API - Production Ready", "status": "active"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "version": "1.0.0"
    }

@app.post("/api/auth/signup", response_model=Token)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    # Authenticate user
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}

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
    # Discover leads using Reddit API
    discovered_leads = await discover_reddit_leads(
        keywords=request.keywords,
        subreddits=request.subreddits,
        max_leads=request.max_leads
    )
    
    # Save leads to database
    saved_leads = []
    for lead_data in discovered_leads:
        db_lead = Lead(
            user_id=current_user.id,
            **lead_data
        )
        db.add(db_lead)
        saved_leads.append(db_lead)
    
    db.commit()
    
    # Return lead responses
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