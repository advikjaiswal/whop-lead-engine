from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Database - Railway provides DATABASE_URL automatically
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/whop_lead_engine"
    
    # Authentication
    JWT_SECRET: str = "your-super-secret-jwt-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_DASHBOARD_API_KEY: str = ""
    
    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    
    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    
    # Email Service
    RESEND_API_KEY: str = ""
    
    # External APIs
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    TWITTER_BEARER_TOKEN: str = ""
    
    # Whop API
    WHOP_API_KEY: str = ""
    WHOP_DASHBOARD_API_KEY: str = ""
    WHOP_API_URL: str = "https://api.whop.com/v1"
    
    # Frontend Whop Configuration
    NEXT_PUBLIC_WHOP_APP_ID: Optional[str] = None
    NEXT_PUBLIC_WHOP_AGENT_USER_ID: Optional[str] = None
    NEXT_PUBLIC_WHOP_COMPANY_ID: Optional[str] = None
    
    # Application Settings
    ENVIRONMENT: str = "production"
    FRONTEND_URL: str = "https://whop-lead-oeh3dhbj6-adviks-projects-3874d3e7.vercel.app"
    BACKEND_URL: str = "https://whop-lead-engine-production.up.railway.app"
    PLATFORM_REVENUE_SHARE: float = 0.15
    
    # CORS - Allow Railway, Vercel and localhost
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://*.railway.app",
        "https://*.up.railway.app",
        "https://whop-lead-engine-production.up.railway.app",
        "https://whop-lead-oeh3dhbj6-adviks-projects-3874d3e7.vercel.app",
        "https://*.vercel.app"
    ]
    
    # Redis - Railway provides REDIS_URL if Redis is added
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()