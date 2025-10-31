#!/bin/bash
# Railway Environment Variables Setup Script

echo "🚀 Setting up Railway environment variables..."

# Set the correct DATABASE_URL for Railway PostgreSQL
echo "Setting DATABASE_URL..."
railway variables set DATABASE_URL="postgresql://postgres:password@postgres-production-93a9.up.railway.app:5432/railway"

# Set other production environment variables
echo "Setting other environment variables..."
railway variables set ENVIRONMENT="production"
railway variables set JWT_SECRET="577287cbe17fd7e933eee6320f222cb905d2322316e749affbfff299c091e27e"
railway variables set JWT_ALGORITHM="HS256"
railway variables set JWT_EXPIRATION_HOURS="24"

# Set API keys to demo mode (you'll update these later)
railway variables set OPENAI_API_KEY="demo-mode"
railway variables set STRIPE_SECRET_KEY="sk_test_demo"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_demo"
railway variables set STRIPE_PUBLISHABLE_KEY="pk_test_demo"
railway variables set RESEND_API_KEY="demo-mode"
railway variables set REDDIT_CLIENT_ID="demo-mode"
railway variables set REDDIT_CLIENT_SECRET="demo-mode"
railway variables set TWITTER_BEARER_TOKEN="demo-mode"
railway variables set WHOP_API_KEY="demo-mode"

# Set application URLs
railway variables set FRONTEND_URL="https://whop-lead-32dpsvxm5-adviks-projects-3874d3e7.vercel.app"
railway variables set BACKEND_URL="https://whop-lead-engine-production.up.railway.app"
railway variables set PLATFORM_REVENUE_SHARE="0.15"

# Set CORS origins
railway variables set CORS_ORIGINS='["https://whop-lead-32dpsvxm5-adviks-projects-3874d3e7.vercel.app", "https://whop-lead-engine-production.up.railway.app"]'

echo "✅ Environment variables set! Now deploying..."
railway up

echo "🎉 Deployment complete!"