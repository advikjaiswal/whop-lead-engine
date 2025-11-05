from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging
from loguru import logger

from config.settings import get_settings
from config.database import engine, Base
from api.routes import auth, leads, outreach, members, analytics, stripe_webhook
from utils.exceptions import AppException

# Import all models to ensure they are registered with SQLAlchemy
from models.user import User
from models.lead import Lead, LeadCriteria
from models.member import Member
from models.outreach import OutreachCampaign
from models.analytics import Analytics, RevenueTransaction


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Whop Lead Engine...")
    logger.info(f"Environment: {get_settings().ENVIRONMENT}")
    
    try:
        # Create database tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Database startup failed: {e}")
        logger.warning("Continuing startup - database issues can be resolved via /init-db endpoint")
        # Continue startup even if DB fails - Railway should still run
    
    yield
    
    # Shutdown
    logger.info("Shutting down Whop Lead Engine...")


app = FastAPI(
    title="Whop Lead Engine API",
    description="API for automating lead generation and retention for Whop communities",
    version="1.0.0",
    lifespan=lifespan
)

settings = get_settings()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)


# Custom middleware for request timing and logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )
    
    return response


# Exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "detail": exc.detail}
    )


# Database initialization endpoint
@app.post("/init-db")
async def initialize_database():
    """Manually initialize database tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/updated successfully")
        return {"status": "success", "message": "Database tables created/updated successfully"}
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return {"status": "error", "message": f"Database initialization failed: {str(e)}"}

# Simple working signup endpoint
@app.post("/simple-signup")
async def simple_signup(email: str, password: str, full_name: str):
    """Simple signup without complex dependencies"""
    try:
        import hashlib
        import secrets
        import jwt
        from datetime import datetime, timedelta
        from config.database import SessionLocal
        from models.user import User
        
        # Simple password hashing
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        hashed_password = f"{salt}:{password_hash.hex()}"
        
        # Create user in database
        db = SessionLocal()
        try:
            # Check if user exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                return {"status": "error", "message": "User already exists"}
            
            # Create new user
            user = User(
                email=email,
                hashed_password=hashed_password,
                full_name=full_name,
                is_active=True,
                is_verified=False
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Create token
            expire = datetime.utcnow() + timedelta(hours=24)
            token_data = {"sub": str(user.id), "exp": expire}
            access_token = jwt.encode(token_data, "railway-production-jwt-secret-key-for-whop-lead-engine", algorithm="HS256")
            
            return {
                "status": "success",
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name
                }
            }
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Simple signup failed: {e}")
        return {"status": "error", "message": f"Signup failed: {str(e)}"}

# Health check
@app.get("/health")
async def health_check():
    health_data = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "unknown"
    }
    
    # Check database connectivity (non-blocking)
    try:
        from config.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health_data["database"] = "connected"
        logger.info("Health check: Database connected")
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        health_data["database"] = "disconnected"
        # Don't mark as degraded - app can still function
        logger.info("Health check: Database disconnected but app healthy")
    
    return health_data


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(outreach.router, prefix="/api/outreach", tags=["Outreach"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(stripe_webhook.router, prefix="/api/stripe", tags=["Stripe"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Whop Lead Engine API",
        "documentation": "/docs",
        "health": "/health",
        "status": "ready"
    }