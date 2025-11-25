from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.api.routes import auth, leads, analytics, workspace, messaging, webhooks, revenue, members, subscriptions, stripe_webhook

# Import all models here to ensure they are registered with Base
from backend.models import user as user_model, lead as lead_model, workspace as workspace_model, revenue as revenue_model
# The MessageFlow model is in lead.py, so this is sufficient

# Create all database tables
print("STARTING APP - PRODUCTION DEPLOYMENT TRIGGER")
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(
    title="Whop Lead Engine API",
    description="Production-ready lead generation system",
    version="1.0.0"
)

# CORS middleware
origins = [
    "http://localhost:3000",
    "https://whop-lead-gen.vercel.app",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(workspace.router, prefix="/api/workspace", tags=["Workspace"])
app.include_router(messaging.router, prefix="/api/messaging", tags=["Messaging"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(revenue.router, prefix="/api/revenue", tags=["Revenue"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(stripe_webhook.router, prefix="/api/webhooks", tags=["Stripe Webhooks"])

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "deployment_id": "restored-full-app"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)