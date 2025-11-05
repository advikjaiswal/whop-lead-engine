from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging
from loguru import logger

# Temporarily disable all imports to isolate startup issue
# from config.settings import get_settings  
# from config.database import engine, Base
# from api.routes import leads, outreach, members, analytics, stripe_webhook, auth
# from utils.exceptions import AppException
# from models.user import User
# from models.lead import Lead, LeadCriteria
# from models.member import Member
# from models.outreach import OutreachCampaign
# from models.analytics import Analytics, RevenueTransaction


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Minimal startup
    logger.info("Starting up minimal FastAPI app...")
    yield
    # Minimal shutdown
    logger.info("Shutting down minimal FastAPI app...")


app = FastAPI(
    title="Whop Lead Engine API",
    description="API for automating lead generation and retention for Whop communities",
    version="1.0.0",
    lifespan=lifespan
)

# Minimal CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


# Minimal health check without database
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "message": "Minimal FastAPI app running"
    }


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