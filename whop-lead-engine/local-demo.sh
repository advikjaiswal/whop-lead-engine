#!/bin/bash
set -e

echo "🚀 Whop Lead Engine - Local Demo Setup"
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

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed!"
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js 18+ and try again."
    exit 1
fi

print_success "Python and Node.js are available"

# Check if PostgreSQL is running locally
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL not found locally. Using SQLite for demo."
    DEMO_DB="sqlite"
else
    print_status "PostgreSQL found. Will attempt to use local PostgreSQL."
    DEMO_DB="postgres"
fi

# Setup backend
print_status "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies (demo version without PostgreSQL)
print_status "Installing backend dependencies (demo version)..."
pip install -r requirements-demo.txt

# Setup environment for demo
print_status "Configuring demo environment..."
cat > .env.demo << EOF
# Demo Environment Configuration
DATABASE_URL=sqlite:///./demo.db
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET_KEY=577287cbe17fd7e933eee6320f222cb905d2322316e749affbfff299c091e27e
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Demo API Keys (no external calls)
OPENAI_API_KEY=demo-mode
STRIPE_SECRET_KEY=demo-mode
STRIPE_WEBHOOK_SECRET=demo-mode
WHOP_API_KEY=demo-mode
RESEND_API_KEY=demo-mode

# Social API Keys (demo mode)
REDDIT_CLIENT_ID=demo-mode
REDDIT_CLIENT_SECRET=demo-mode
TWITTER_BEARER_TOKEN=demo-mode
DISCORD_BOT_TOKEN=demo-mode

# Demo Mode
DEMO_MODE=true
EOF

export $(grep -v '^#' .env.demo | xargs)

# Initialize database
print_status "Initializing demo database..."
python -c "
from config.database import engine, Base
from models import user, lead, outreach, member, analytics
import os

# Create tables
Base.metadata.create_all(bind=engine)
print('Database tables created')
"

# Create demo user
print_status "Creating demo user..."
python -c "
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

# Start backend server in background
print_status "Starting backend server..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Setup frontend
print_status "Setting up frontend..."
cd ../frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Start frontend server in background
print_status "Starting frontend server..."
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev &
FRONTEND_PID=$!

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 10

# Check if services are running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    print_success "Backend is running!"
else
    print_warning "Backend may still be starting..."
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is running!"
else
    print_warning "Frontend may still be starting..."
fi

echo ""
print_success "🎉 Local Demo is ready!"
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
echo "To stop the demo:"
echo "================="
echo "Press Ctrl+C to stop this script"
echo "Or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
print_warning "Note: This is running in demo mode with mock data and SQLite."
print_warning "For production, you'll need real API keys and PostgreSQL."

# Keep script running and handle cleanup
cleanup() {
    print_status "Stopping demo servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    print_success "Demo stopped"
    exit 0
}

trap cleanup INT TERM

# Wait for user to stop
while true; do
    sleep 1
done