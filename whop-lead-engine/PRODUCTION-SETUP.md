# 🚀 Production Setup Guide - API Keys & Configuration

This guide covers all the API keys and configurations needed to make Whop Lead Engine fully production-ready for selling to Whop communities.

## 📋 Required API Keys for Production

### 🤖 1. OpenAI API Key (CRITICAL - Required for AI features)

**Purpose**: Powers all AI features including lead analysis, personalization, and retention messaging.

**How to get it**:
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up/Login to your account
3. Go to [API Keys section](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

**Cost**: ~$0.03 per 1K tokens (very affordable for the value)
**Monthly estimate**: $50-200 depending on usage

```bash
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### 💳 2. Stripe API Keys (CRITICAL - Required for payments)

**Purpose**: Handles all payments, revenue sharing, and Stripe Connect for community owners.

**How to get it**:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account (or login)
3. Go to Developers > API keys
4. Copy both Publishable and Secret keys
5. For webhooks: Developers > Webhooks > Add endpoint

**Webhook endpoint**: `https://yourdomain.com/api/stripe/webhook`
**Events to listen for**:
- `payment_intent.succeeded`
- `invoice.payment_succeeded` 
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

```bash
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 📧 3. Email Service API Key (CRITICAL - Required for outreach)

**Purpose**: Sends outreach emails and retention messages.

**Recommended: Resend** (Best deliverability)
1. Go to [Resend](https://resend.com)
2. Sign up for account
3. Go to API Keys section
4. Create new key
5. Add your domain for better deliverability

**Alternative: SendGrid, Mailgun, AWS SES**

```bash
RESEND_API_KEY=re_your-resend-api-key
```

### 🔍 4. Social Media APIs (OPTIONAL - for lead scraping)

#### Reddit API
**Purpose**: Scrapes Reddit for potential leads in relevant communities.

**How to get it**:
1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App"
3. Choose "script" type
4. Get Client ID and Secret

```bash
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
```

#### Twitter API
**Purpose**: Finds leads from Twitter based on keywords and interests.

**How to get it**:
1. Apply at [Twitter Developer Portal](https://developer.twitter.com)
2. Create a project and app
3. Get Bearer Token

```bash
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
```

### 🏢 5. Whop API Integration (OPTIONAL - for direct integration)

**Purpose**: Direct integration with Whop communities for member data.

**How to get it**:
1. Contact Whop support for API access
2. Each community owner provides their API key
3. Currently using mock data (works fine without real API)

```bash
WHOP_API_KEY=your-whop-api-key
WHOP_API_URL=https://api.whop.com/v1
```

## 🗄️ Database Setup Options

### Option 1: Managed Database (Recommended)
- **Supabase**: Free tier available, easy setup
- **PlanetScale**: Serverless MySQL, great scaling
- **AWS RDS**: Enterprise-grade PostgreSQL
- **DigitalOcean Managed Database**: Cost-effective

### Option 2: Self-hosted PostgreSQL
- Included in Docker setup
- Fine for small to medium scale

```bash
# For managed database
DATABASE_URL=postgresql://user:password@host:5432/database

# For local development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whop_lead_engine
```

## 💰 Revenue Model & Pricing

### Platform Revenue Share
```bash
PLATFORM_REVENUE_SHARE=0.15  # 15% platform fee
```

### Suggested Pricing for Community Owners
- **Starter Plan**: $97/month - Up to 500 leads, 1K emails
- **Growth Plan**: $297/month - Up to 2K leads, 5K emails  
- **Pro Plan**: $597/month - Unlimited leads and emails
- **Enterprise**: Custom pricing for large communities

### Your Revenue Potential
- 10 customers × $297/month = $2,970/month
- 50 customers × $297/month = $14,850/month
- 100 customers × $297/month = $29,700/month

Plus 15% of all revenue generated through the platform!

## 🚀 Deployment Options

### Option 1: Vercel + Railway (Easiest)
```bash
# Frontend on Vercel
cd frontend
vercel --prod

# Backend on Railway
# Connect GitHub repo to Railway
# Add environment variables in Railway dashboard
```

### Option 2: DigitalOcean App Platform
```bash
# Push to GitHub
# Connect repo to DigitalOcean Apps
# Configure environment variables
```

### Option 3: AWS (Enterprise)
```bash
# ECS Fargate for backend
# CloudFront + S3 for frontend
# RDS for database
```

## 🔧 Production Environment Configuration

Create `.env.production`:

```bash
# Core Settings
ENVIRONMENT=production
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Database (use managed database URL)
DATABASE_URL=postgresql://user:password@host:5432/whop_lead_engine_prod

# Security
JWT_SECRET=your-super-secure-256-bit-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# APIs (add your real keys)
OPENAI_API_KEY=sk-your-openai-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
RESEND_API_KEY=re_your-resend-key

# Optional APIs
REDDIT_CLIENT_ID=your-reddit-id
REDDIT_CLIENT_SECRET=your-reddit-secret
TWITTER_BEARER_TOKEN=your-twitter-token

# Revenue Settings
PLATFORM_REVENUE_SHARE=0.15

# CORS (add your actual domains)
CORS_ORIGINS=["https://yourdomain.com", "https://api.yourdomain.com"]
```

## 📊 Monitoring & Analytics Setup

### Essential Monitoring
1. **Error Tracking**: Sentry
2. **Analytics**: Google Analytics, Mixpanel
3. **Uptime Monitoring**: Pingdom, UptimeRobot
4. **Performance**: DataDog, New Relic

### Key Metrics to Track
- Lead generation volume
- Email deliverability rates
- Customer churn rate
- Revenue per customer
- API response times
- Error rates

## 🛡️ Security Checklist

### Required for Production
- [ ] HTTPS/SSL certificates
- [ ] Environment variables secured
- [ ] Database backups automated
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] JWT secrets are secure
- [ ] Stripe webhooks verified
- [ ] Error logging implemented

## 🎯 Go-to-Market Strategy

### Target Customers
1. **Whop Community Owners** with 100+ members
2. **Discord Communities** looking to monetize
3. **Course Creators** with communities
4. **Coaches/Consultants** with membership sites

### Sales Approach
1. **Free Trial**: 14-day free trial with demo data
2. **Case Studies**: Show ROI examples
3. **Community Partnerships**: Partner with top Whop communities
4. **Content Marketing**: Blog about community growth
5. **Social Proof**: Display customer testimonials

### Pricing Strategy
- Start with lower prices to gain customers
- Increase as you add more features
- Offer annual discounts
- Create enterprise tiers for large communities

## 📞 Support & Maintenance

### Customer Support Channels
- Discord server for community
- Email support
- Knowledge base/docs
- Video tutorials

### Maintenance Tasks
- Weekly: Monitor system health
- Monthly: Review customer feedback
- Quarterly: Add new features
- Yearly: Security audit

## 💡 Feature Roadmap

### Phase 1 (Current)
✅ Lead generation and analysis
✅ Outreach automation
✅ Retention monitoring
✅ Revenue tracking

### Phase 2 (Next 3 months)
- [ ] Advanced AI personalization
- [ ] Instagram/TikTok lead scraping
- [ ] Custom email templates
- [ ] A/B testing for campaigns

### Phase 3 (Next 6 months)
- [ ] Mobile app
- [ ] API for integrations
- [ ] White-label solutions
- [ ] Advanced analytics

## 🚀 Launch Checklist

### Before Launch
- [ ] All API keys configured and tested
- [ ] Database backed up
- [ ] SSL certificates installed
- [ ] Monitoring tools configured
- [ ] Legal pages (Terms, Privacy) created
- [ ] Payment processing tested
- [ ] Demo environment working

### Marketing Launch
- [ ] Landing page optimized
- [ ] Social media accounts created
- [ ] Content calendar planned
- [ ] Early customers identified
- [ ] Feedback collection system ready

## 💰 Expected Costs (Monthly)

### Development & Operations
- OpenAI API: $50-200
- Stripe fees: 2.9% of revenue
- Email service: $20-100
- Hosting: $50-200
- Database: $25-100
- Monitoring: $50-100

### Total monthly overhead: ~$200-500
### Break-even: ~2-3 customers at $297/month

This is a highly profitable SaaS business model with minimal overhead!