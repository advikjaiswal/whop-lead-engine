#!/bin/bash
set -e

echo "🚀 Whop Lead Engine - Quick Demo Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running!"
    echo "Please start Docker Desktop and try again."
    echo "1. Open Docker Desktop"
    echo "2. Wait for it to fully start (icon in menu bar becomes solid)"
    echo "3. Run this script again"
    exit 1
fi

print_success "Docker is running"

# Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true

# Start the services
print_status "Starting Whop Lead Engine demo..."
docker-compose up -d --build

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 15

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "Services are running!"
else
    print_error "Services failed to start"
    echo "Checking logs..."
    docker-compose logs
    exit 1
fi

# Wait for database to be ready and run migrations
print_status "Setting up database..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T backend python -c "from config.database import engine; engine.execute('SELECT 1')" >/dev/null 2>&1; then
        break
    fi
    print_status "Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Database connection failed"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T backend alembic upgrade head

# Create demo user
print_status "Creating demo user..."
docker-compose exec -T backend python -c "
import sys
sys.path.append('.')
from sqlalchemy.orm import Session
from config.database import SessionLocal
from models.user import User
from utils.auth import get_password_hash

db = SessionLocal()

# Check if demo user exists
existing_user = db.query(User).filter(User.email == 'demo@example.com').first()
if existing_user:
    print('Demo user already exists')
else:
    demo_user = User(
        email='demo@example.com',
        hashed_password=get_password_hash('demo123456'),
        full_name='Demo User',
        whop_community_name='Demo Community',
        is_active=True,
        is_verified=True
    )
    db.add(demo_user)
    db.commit()
    print('Demo user created successfully')

db.close()
"

echo ""
print_success "🎉 Demo is ready!"
echo ""
echo "Access URLs:"
echo "============"
echo "🌐 Frontend (Dashboard): http://localhost:3000"
echo "⚡ Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Demo Login Credentials:"
echo "======================="
echo "📧 Email: demo@example.com"
echo "🔑 Password: demo123456"
echo ""
echo "What to test:"
echo "============="
echo "✅ Sign up for a new account or use demo credentials"
echo "✅ Explore the dashboard and analytics"
echo "✅ Try the lead generation (will show mock data)"
echo "✅ Create outreach campaigns"
echo "✅ Check member retention features"
echo "✅ View revenue analytics"
echo ""
echo "Useful Commands:"
echo "==============="
echo "📊 View logs: docker-compose logs -f"
echo "🔄 Restart: docker-compose restart"
echo "🛑 Stop demo: docker-compose down"
echo "🧹 Clean up: docker-compose down -v"
echo ""
print_warning "Note: This is running in demo mode with mock data."
print_warning "For production, you'll need real API keys (see production setup below)."