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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Whop Lead Engine...")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
    
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
    allow_origins=settings.CORS_ORIGINS,
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


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }


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
        "health": "/health"
    }