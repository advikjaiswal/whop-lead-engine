# 🚀 Railway Database Fix Guide

## Quick Fix Commands

### 1. Login to Railway
```bash
railway login
```

### 2. Get PostgreSQL Connection Details
Go to Railway Dashboard → PostgreSQL service → Variables tab

Copy the **complete DATABASE_URL** (should look like):
```
postgresql://postgres:XXXXX@postgres-production-93a9.up.railway.app:5432/railway
```

### 3. Set Environment Variables
```bash
# Replace XXXXX with actual password from PostgreSQL service
railway variables set DATABASE_URL="postgresql://postgres:XXXXX@postgres-production-93a9.up.railway.app:5432/railway"

# Set other required variables
railway variables set ENVIRONMENT="production"
railway variables set JWT_SECRET="577287cbe17fd7e933eee6320f222cb905d2322316e749affbfff299c091e27e"
railway variables set FRONTEND_URL="https://whop-lead-32dpsvxm5-adviks-projects-3874d3e7.vercel.app"
railway variables set BACKEND_URL="https://whop-lead-engine-production.up.railway.app"
```

### 4. Deploy
```bash
railway up
```

### 5. Test
```bash
python3 test_deployment.py https://whop-lead-engine-production.up.railway.app
```

## ✅ Expected Result
After fixing DATABASE_URL, you should see:
- Health check: `"database": "connected"`
- User signup working
- All API endpoints functional

## 🔑 API Keys to Add Later
Once database is working, add these for full functionality:
```bash
railway variables set OPENAI_API_KEY="your-actual-openai-key"
railway variables set STRIPE_SECRET_KEY="your-actual-stripe-key"
railway variables set RESEND_API_KEY="your-actual-resend-key"
```

## 🌐 Your URLs
- **Backend**: https://whop-lead-engine-production.up.railway.app
- **Frontend**: https://whop-lead-32dpsvxm5-adviks-projects-3874d3e7.vercel.app
- **API Docs**: https://whop-lead-engine-production.up.railway.app/docs