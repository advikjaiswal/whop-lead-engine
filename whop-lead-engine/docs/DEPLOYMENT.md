# 🚀 Deployment Guide

This guide covers various deployment options for Whop Lead Engine, from local development to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Production Setup](#production-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Docker & Docker Compose

**Recommended for Production:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- Load balancer
- SSL certificate

### Required Services

1. **PostgreSQL Database** (v13+)
2. **Redis** (v6+)
3. **Email Service** (Resend, SendGrid, etc.)
4. **External APIs:**
   - OpenAI API (required)
   - Stripe (required for payments)
   - Reddit API (optional)
   - Twitter API (optional)

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Required Variables

```bash
# Core Application
ENVIRONMENT=production
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-256-bit-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# OpenAI (Required)
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe (Required)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key

# Email Service
RESEND_API_KEY=re_your-resend-api-key

# External APIs (Optional)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token

# Revenue Settings
PLATFORM_REVENUE_SHARE=0.15
```

### 3. Security Configuration

```bash
# Generate strong JWT secret
openssl rand -hex 32

# Generate secure passwords
openssl rand -base64 32
```

## Docker Deployment

### Development Environment

```bash
# Start development environment
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Production Environment

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Create superuser (optional)
docker-compose exec backend python scripts/create_admin.py
```

### Docker Commands

```bash
# Scale services
docker-compose up --scale backend=3 --scale frontend=2

# Update services
docker-compose pull
docker-compose up -d --build

# Backup database
docker-compose exec postgres pg_dump -U postgres whop_lead_engine > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres whop_lead_engine < backup.sql

# View service status
docker-compose ps

# Check resource usage
docker stats
```

## Cloud Deployment

### AWS Deployment

#### Option 1: ECS Fargate

1. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name whop-lead-engine
```

2. **Build and Push Images**
```bash
# Build images
docker build -t whop-backend ./backend
docker build -t whop-frontend ./frontend

# Tag for ECR
docker tag whop-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/whop-backend:latest
docker tag whop-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/whop-frontend:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/whop-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/whop-frontend:latest
```

3. **Create Task Definition**
```json
{
  "family": "whop-lead-engine",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/whop-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ]
    }
  ]
}
```

#### Option 2: EC2 with Docker

```bash
# Launch EC2 instance (Ubuntu 20.04 LTS)
# SSH into instance

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu

# Clone repository
git clone https://github.com/your-repo/whop-lead-engine.git
cd whop-lead-engine

# Configure environment
cp .env.example .env
# Edit .env with production values

# Deploy
make deploy-prod
```

### Google Cloud Platform

#### Cloud Run Deployment

1. **Build and Deploy Backend**
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/whop-backend ./backend

# Deploy to Cloud Run
gcloud run deploy whop-backend \
  --image gcr.io/PROJECT_ID/whop-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://..."
```

2. **Build and Deploy Frontend**
```bash
# Build and push frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/whop-frontend ./frontend

# Deploy frontend
gcloud run deploy whop-frontend \
  --image gcr.io/PROJECT_ID/whop-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL="https://whop-backend-xxx.run.app"
```

### DigitalOcean App Platform

Create `app.yaml`:

```yaml
name: whop-lead-engine
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/whop-lead-engine
    branch: main
  run_command: uvicorn main:app --host 0.0.0.0 --port 8080
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${DATABASE_URL}
  - key: OPENAI_API_KEY
    value: ${OPENAI_API_KEY}

- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/whop-lead-engine
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: ${backend.PUBLIC_URL}

databases:
- engine: PG
  name: whop-db
  num_nodes: 1
  size: basic-xs
  version: "13"
```

Deploy:
```bash
doctl apps create --spec app.yaml
```

### Vercel (Frontend Only)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## Production Setup

### 1. Database Setup

#### Managed Database (Recommended)

- **AWS RDS PostgreSQL**
- **Google Cloud SQL**
- **DigitalOcean Managed Database**
- **PlanetScale** (MySQL alternative)

#### Self-Hosted Database

```bash
# Create production database
createdb whop_lead_engine_prod

# Run migrations
cd backend
alembic upgrade head

# Create admin user
python scripts/create_admin.py
```

### 2. SSL/HTTPS Setup

#### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

#### Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Update DNS records
3. Enable SSL/TLS encryption
4. Configure security settings

### 3. Load Balancer Setup

#### Nginx Configuration

```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### AWS Application Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name whop-backend-targets \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-12345678

# Create load balancer
aws elbv2 create-load-balancer \
  --name whop-load-balancer \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups sg-12345678
```

### 4. Background Workers

#### Celery Setup

```bash
# Start Celery workers
celery -A tasks.celery worker --loglevel=info --concurrency=4

# Start Celery beat (scheduler)
celery -A tasks.celery beat --loglevel=info

# Monitor with Flower
celery -A tasks.celery flower --port=5555
```

#### Systemd Services

Create `/etc/systemd/system/whop-worker.service`:

```ini
[Unit]
Description=Whop Lead Engine Celery Worker
After=network.target

[Service]
Type=simple
User=whop
Group=whop
WorkingDirectory=/opt/whop-lead-engine/backend
Environment=PATH=/opt/whop-lead-engine/venv/bin
ExecStart=/opt/whop-lead-engine/venv/bin/celery -A tasks.celery worker --loglevel=info
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable whop-worker
sudo systemctl start whop-worker
```

### 5. Cron Jobs

Add to crontab:
```bash
# Lead scraping (every 2 hours)
0 */2 * * * cd /opt/whop-lead-engine && python scripts/lead_scraper.py

# Retention bot (daily at 10 AM)
0 10 * * * cd /opt/whop-lead-engine && python scripts/retention_bot.py

# Analytics update (every hour)
0 * * * * cd /opt/whop-lead-engine && python scripts/update_analytics.py

# Database backup (daily at 2 AM)
0 2 * * * /opt/whop-lead-engine/scripts/backup_db.sh
```

## Monitoring & Maintenance

### 1. Health Checks

```bash
# Application health
curl https://api.yourdomain.com/health

# Database health
curl https://api.yourdomain.com/api/health/db

# Redis health
curl https://api.yourdomain.com/api/health/redis
```

### 2. Logging Setup

#### Structured Logging

```python
# backend/config/logging.py
import logging
import sys
from loguru import logger

logger.remove()
logger.add(
    sys.stdout,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
    level="INFO"
)
logger.add(
    "logs/app.log",
    rotation="1 day",
    retention="30 days",
    compression="gzip",
    level="INFO"
)
```

#### Log Aggregation

**ELK Stack:**
```yaml
# docker-compose.logging.yml
services:
  elasticsearch:
    image: elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: logstash:7.15.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:7.15.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### 3. Metrics & Monitoring

#### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

#### Application Metrics

```python
# backend/utils/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path
    ).inc()
    
    REQUEST_DURATION.observe(time.time() - start_time)
    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### 4. Backup Strategy

#### Database Backups

```bash
#!/bin/bash
# scripts/backup_db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# Create backup
pg_dump $DATABASE_URL > /backups/$BACKUP_FILE

# Compress backup
gzip /backups/$BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp /backups/$BACKUP_FILE.gz s3://whop-backups/

# Clean old backups (keep last 30 days)
find /backups -name "backup_*.sql.gz" -mtime +30 -delete
```

#### Application Backups

```bash
#!/bin/bash
# scripts/backup_app.sh

# Backup application files
tar -czf /backups/app_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude='node_modules' \
  --exclude='venv' \
  --exclude='*.log' \
  /opt/whop-lead-engine/

# Upload to cloud storage
aws s3 sync /backups/ s3://whop-backups/app/
```

### 5. Update Procedures

#### Rolling Updates

```bash
# 1. Build new images
docker-compose -f docker-compose.prod.yml build

# 2. Update database (if needed)
docker-compose exec backend alembic upgrade head

# 3. Update backend (rolling update)
docker-compose up -d --no-deps backend

# 4. Update frontend
docker-compose up -d --no-deps frontend

# 5. Verify deployment
curl https://api.yourdomain.com/health
```

#### Blue-Green Deployment

```bash
# 1. Deploy to green environment
docker-compose -f docker-compose.green.yml up -d --build

# 2. Run health checks
./scripts/health_check.sh green

# 3. Switch traffic (update load balancer)
./scripts/switch_traffic.sh green

# 4. Monitor for issues

# 5. Cleanup blue environment (after verification)
docker-compose -f docker-compose.blue.yml down
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check database connectivity
docker-compose exec backend python -c "from config.database import engine; print(engine.execute('SELECT 1').scalar())"

# Check database logs
docker-compose logs postgres
```

#### 2. Redis Connection Issues

```bash
# Test Redis connection
docker-compose exec backend python -c "import redis; r=redis.Redis(host='redis'); print(r.ping())"

# Check Redis logs
docker-compose logs redis
```

#### 3. High Memory Usage

```bash
# Check container resource usage
docker stats

# Scale down services if needed
docker-compose up --scale backend=1 --scale frontend=1

# Optimize container resources
# Update docker-compose.yml with memory limits
```

#### 4. Slow API Responses

```bash
# Check database performance
docker-compose exec postgres psql -U postgres -d whop_lead_engine -c "SELECT * FROM pg_stat_activity;"

# Check API logs for slow queries
docker-compose logs backend | grep "slow"

# Monitor with APM tools
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX CONCURRENTLY idx_leads_user_id_status ON leads(user_id, status);
CREATE INDEX CONCURRENTLY idx_leads_created_at ON leads(created_at);
CREATE INDEX CONCURRENTLY idx_members_churn_risk ON members(churn_risk);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM leads WHERE user_id = 1 AND status = 'new';
```

#### 2. Caching Strategy

```python
# Redis caching for expensive operations
import redis
import json

redis_client = redis.Redis(host='redis', port=6379, db=0)

def cache_analytics(user_id: int, data: dict):
    key = f"analytics:{user_id}"
    redis_client.setex(key, 3600, json.dumps(data))  # Cache for 1 hour

def get_cached_analytics(user_id: int):
    key = f"analytics:{user_id}"
    cached = redis_client.get(key)
    return json.loads(cached) if cached else None
```

#### 3. CDN Setup

```bash
# Configure CloudFlare or AWS CloudFront
# Cache static assets: images, CSS, JS
# Set appropriate cache headers
```

### Security Hardening

#### 1. Network Security

```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 8000   # Block direct backend access
```

#### 2. Container Security

```dockerfile
# Use non-root user in containers
FROM python:3.11-slim

RUN useradd -m -u 1000 appuser
USER appuser

# Scan for vulnerabilities
docker scan whop-backend:latest
```

#### 3. Environment Security

```bash
# Encrypt environment variables
ansible-vault encrypt .env

# Use secrets management
# AWS Secrets Manager, HashiCorp Vault, etc.
```

This deployment guide provides comprehensive coverage of deploying Whop Lead Engine in various environments. Choose the deployment method that best fits your needs and scale requirements.