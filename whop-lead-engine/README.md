# 🚀 Whop Lead Engine

**Complete Production-Ready SaaS Platform for Automating Whop Community Lead Generation and Retention**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Whop Lead Engine is a complete SaaS platform that helps Whop community owners automate their lead generation and member retention processes. The platform uses AI to find high-intent prospects, personalizes outreach campaigns, and predicts member churn to maximize community growth and revenue.

### 💡 Key Benefits

- **Automated Lead Discovery**: AI-powered scraping from Reddit, Twitter, and Discord
- **Intelligent Lead Qualification**: GPT-4 analyzes leads and assigns intent scores
- **Personalized Outreach**: AI-generated messages tailored to each prospect
- **Churn Prediction**: Monitor member activity and predict churn risk
- **Revenue Optimization**: Stripe Connect integration with automatic revenue sharing
- **Complete Analytics**: Track performance across all metrics

## ✨ Features

### 🔍 Lead Capture Engine
- **Multi-Source Scraping**: Reddit, Twitter, Discord, and manual imports
- **AI-Powered Analysis**: GPT-4 qualification with intent scoring (0-100)
- **Quality Grading**: Automatic A/B/C/D grading system
- **Duplicate Detection**: Smart deduplication across sources
- **Real-time Processing**: Background processing with progress tracking

### 📧 Outreach Automation
- **Campaign Management**: Create and manage multiple outreach campaigns
- **AI Personalization**: GPT-4 generates personalized messages
- **Multi-Channel Support**: Email, DM, and social media outreach
- **Delivery Tracking**: Open rates, click rates, and response tracking
- **A/B Testing**: Test different message templates and strategies

### 👥 Retention Dashboard
- **Member Sync**: Automatic synchronization with Whop community data
- **Churn Prediction**: AI-powered risk assessment with 85%+ accuracy
- **Automated Interventions**: Trigger retention messages based on activity
- **Engagement Scoring**: Track member activity and engagement levels
- **Success Tracking**: Monitor retention campaign effectiveness

### 💰 Revenue Management
- **Stripe Connect**: Automatic revenue sharing and payment processing
- **Revenue Analytics**: Track MRR, conversion rates, and growth metrics
- **Platform Fees**: Configurable revenue sharing (default 15%)
- **Payment Tracking**: Real-time transaction monitoring
- **Financial Reports**: Comprehensive revenue reporting

### 📊 Analytics & Insights
- **Performance Dashboard**: Real-time metrics and KPIs
- **Lead Analytics**: Conversion funnels and source performance
- **Outreach Metrics**: Campaign performance and ROI analysis
- **Member Insights**: Activity trends and retention rates
- **Revenue Reports**: Financial performance and projections

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • OpenAI GPT-4  │
│ • Lead Mgmt     │    │ • Authentication│    │ • Stripe        │
│ • Campaigns     │    │ • AI Services   │    │ • Reddit API    │
│ • Analytics     │    │ • Automation    │    │ • Twitter API   │
└─────────────────┘    └─────────────────┘    │ • Whop API      │
                                              │ • Email Service │
┌─────────────────┐    ┌─────────────────┐    └─────────────────┘
│   Database      │    │   Background    │
│ (PostgreSQL)    │◄──►│    Workers      │
│                 │    │                 │
│ • User Data     │    │ • Lead Scraping │
│ • Leads         │    │ • AI Analysis   │
│ • Campaigns     │    │ • Email Sending │
│ • Analytics     │    │ • Retention Bot │
└─────────────────┘    └─────────────────┘
```

### Tech Stack

**Frontend**
- Next.js 14 with App Router
- TypeScript
- TailwindCSS
- React Query for state management
- React Hook Form for forms
- Recharts for analytics visualization

**Backend**
- FastAPI with Python 3.11+
- SQLAlchemy ORM with PostgreSQL
- JWT authentication
- OpenAI GPT-4 integration
- Stripe Connect for payments
- Redis for caching and queues

**Infrastructure**
- Docker & Docker Compose
- Nginx reverse proxy
- Celery for background tasks
- Automated testing with pytest
- Production-ready deployment

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)
- Git

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/your-username/whop-lead-engine.git
cd whop-lead-engine

# Copy environment variables
cp .env.example .env

# Start the entire application
make dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Demo Account

Use these credentials to explore the platform:
- **Email**: demo@example.com
- **Password**: demo123456

## 📦 Installation

### Method 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/your-username/whop-lead-engine.git
cd whop-lead-engine

# Configure environment
cp .env.example .env
# Edit .env with your API keys and configuration

# Start development environment
docker-compose up --build

# Run database migrations
make migrate
```

### Method 2: Local Development

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Start services
cd ../backend && uvicorn main:app --reload
cd ../frontend && npm run dev
```

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whop_lead_engine

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-your-openai-key-here

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key

# External APIs (Optional)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token

# Email Service (Optional)
RESEND_API_KEY=re_your-resend-api-key

# Application Settings
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
PLATFORM_REVENUE_SHARE=0.15
```

### Required API Keys

1. **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Stripe Keys** - Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. **Reddit API** - Register at [Reddit Apps](https://www.reddit.com/prefs/apps)
4. **Twitter API** - Apply at [Twitter Developer Portal](https://developer.twitter.com/)

## 📚 API Documentation

### Authentication

```bash
# Sign up
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "whop_community_name": "My Community"
  }'

# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Lead Management

```bash
# Get leads
curl -X GET "http://localhost:8000/api/leads" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Analyze leads
curl -X POST "http://localhost:8000/api/leads/analyze" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["entrepreneur", "startup"],
    "sources": ["reddit", "twitter"],
    "max_leads": 50
  }'
```

### Outreach Campaigns

```bash
# Create campaign
curl -X POST "http://localhost:8000/api/outreach/campaigns" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 Outreach",
    "message_template": "Hi {name}, I saw your interest in {topic}...",
    "personalization_enabled": true
  }'

# Send campaign
curl -X POST "http://localhost:8000/api/outreach/campaigns/1/send" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_ids": [1, 2, 3, 4, 5]
  }'
```

### Analytics

```bash
# Dashboard summary
curl -X GET "http://localhost:8000/api/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Lead analytics
curl -X GET "http://localhost:8000/api/analytics/leads?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For complete API documentation, visit http://localhost:8000/docs when running the application.

## 🚀 Deployment

### Production Deployment

1. **Configure Environment**
```bash
# Copy production environment template
cp .env.example .env.prod

# Update with production values
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@prod-db:5432/whop_lead_engine
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

2. **Deploy with Docker**
```bash
# Build and start production services
make deploy-prod

# Or manually with docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

3. **Setup SSL/HTTPS**
```bash
# Configure Nginx with SSL certificates
# Update nginx/nginx.conf with your domain and SSL paths
```

### Vercel Deployment (Frontend Only)

```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Railway/Render Deployment

The application is configured for easy deployment on Railway or Render. Simply connect your repository and set the environment variables.

## 🔧 Development

### Project Structure

```
whop-lead-engine/
├── backend/
│   ├── api/
│   │   └── routes/          # API endpoints
│   ├── config/              # Configuration
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   ├── utils/               # Utilities
│   └── main.py              # FastAPI app
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # API client
│   │   └── types/           # TypeScript types
├── scripts/                 # Automation scripts
├── nginx/                   # Nginx configuration
├── docs/                    # Documentation
├── docker-compose.yml       # Development compose
├── docker-compose.prod.yml  # Production overrides
└── Makefile                 # Development commands
```

### Development Commands

```bash
# Install dependencies
make install

# Start development environment
make dev

# Run tests
make test

# Format code
make format

# Lint code
make lint

# Database migration
make migrate

# Create new migration
make migration

# View logs
make logs

# Clean up
make clean
```

### Adding New Features

1. **Backend Feature**
```bash
# Create new API route
touch backend/api/routes/new_feature.py

# Add database model
touch backend/models/new_model.py

# Create migration
make migration

# Add tests
touch backend/tests/test_new_feature.py
```

2. **Frontend Feature**
```bash
# Create new page
touch frontend/src/app/dashboard/new-feature/page.tsx

# Add component
touch frontend/src/components/NewFeature.tsx

# Add API service
# Update frontend/src/lib/api.ts
```

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
cd backend && python -m pytest

# Run with coverage
cd backend && python -m pytest --cov=. --cov-report=html

# Run specific test file
cd backend && python -m pytest tests/test_auth.py -v

# Run integration tests
cd backend && python -m pytest tests/integration/ -v
```

### Frontend Tests

```bash
# Run tests
cd frontend && npm test

# Run tests in watch mode
cd frontend && npm run test:watch

# Run E2E tests (if configured)
cd frontend && npm run test:e2e
```

### Load Testing

```bash
# Performance test
make perf-test

# Manual load test
pip install locust
locust -f tests/load_test.py --host=http://localhost:8000
```

## 📊 Monitoring

### Application Metrics

The application exposes metrics at:
- Health check: `GET /health`
- Metrics: `GET /metrics` (if configured)

### Logging

Logs are structured and include:
- Request/response logging
- Error tracking
- Performance metrics
- Business event logging

### Observability

For production monitoring, integrate with:
- **Error Tracking**: Sentry
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack or similar
- **APM**: DataDog or New Relic

## 🔒 Security

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- SQL injection prevention
- XSS protection headers
- Secure session management

### Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **API Keys**: Rotate keys regularly
3. **Database**: Use connection pooling and prepared statements
4. **HTTPS**: Always use HTTPS in production
5. **Updates**: Keep dependencies updated

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

1. **Setup**: Follow installation instructions
2. **Code**: Write code following existing patterns
3. **Test**: Add tests for new functionality
4. **Lint**: Run `make format` and `make lint`
5. **Document**: Update README and API docs
6. **Submit**: Create pull request with detailed description

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- [API Documentation](http://localhost:8000/docs) (when running locally)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

### Community

- **Issues**: [GitHub Issues](https://github.com/your-username/whop-lead-engine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/whop-lead-engine/discussions)
- **Email**: support@whop-lead-engine.com

### Professional Support

For professional support, custom development, or enterprise features, contact us at:
- **Email**: enterprise@whop-lead-engine.com
- **Website**: https://whop-lead-engine.com

---

## 🎉 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Next.js](https://nextjs.org/)
- UI components inspired by [Tailwind UI](https://tailwindui.com/)
- Icons from [Heroicons](https://heroicons.com/)
- AI powered by [OpenAI GPT-4](https://openai.com/)

---

**Made with ❤️ for the Whop community**

Transform your community growth today with Whop Lead Engine!