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
# Temporarily disable routes to isolate startup issue
# from api.routes import leads, outreach, members, analytics, stripe_webhook, auth
from utils.exceptions import AppException

# Import essential models for simple signup
from models.user import User


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
        logger.warning("Continuing startup - database issues can be resolved via /simple-signup endpoint")
    
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

# CORS middleware
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

# Minimal test signup endpoint
@app.post("/simple-signup")
async def simple_signup(request: Request):
    """Minimal signup endpoint for testing Railway connectivity"""
    try:
        # Parse form data
        form_data = await request.form()
        email = form_data.get("email")
        password = form_data.get("password") 
        full_name = form_data.get("full_name")
        
        if not email or not password or not full_name:
            return {"status": "error", "message": "Missing required fields"}
        
        logger.info(f"Test signup for: {email}")
        
        # Return a simple success response with mock token
        return {
            "status": "success",
            "access_token": "test_token_123",
            "token_type": "bearer",
            "user": {
                "id": "test_user",
                "email": email,
                "full_name": full_name
            }
        }
            
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
        logger.info("Health check: Database disconnected but app healthy")
    
    return health_data


# Include routers - temporarily disabled to isolate startup issue
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
# app.include_router(outreach.router, prefix="/api/outreach", tags=["Outreach"])
# app.include_router(members.router, prefix="/api/members", tags=["Members"])
# app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
# app.include_router(stripe_webhook.router, prefix="/api/stripe", tags=["Stripe"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Whop Lead Engine API",
        "documentation": "/docs",
        "health": "/health",
        "status": "ready"
    }