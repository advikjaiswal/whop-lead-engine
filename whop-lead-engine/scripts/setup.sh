#!/bin/bash
set -e

# Whop Lead Engine - Setup Script
# This script sets up the development environment

echo "🚀 Whop Lead Engine Setup"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        echo "Please install the missing dependencies and run this script again."
        echo ""
        echo "Installation guides:"
        echo "- Docker: https://docs.docker.com/get-docker/"
        echo "- Docker Compose: https://docs.docker.com/compose/install/"
        echo "- Git: https://git-scm.com/downloads"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    # Generate JWT secret if not set
    if ! grep -q "JWT_SECRET=your-super-secret-jwt-key-here" .env; then
        print_status "JWT secret already configured"
    else
        if command_exists openssl; then
            JWT_SECRET=$(openssl rand -hex 32)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/JWT_SECRET=your-super-secret-jwt-key-here/JWT_SECRET=$JWT_SECRET/" .env
            else
                # Linux
                sed -i "s/JWT_SECRET=your-super-secret-jwt-key-here/JWT_SECRET=$JWT_SECRET/" .env
            fi
            print_success "Generated secure JWT secret"
        else
            print_warning "OpenSSL not found, please manually set JWT_SECRET in .env"
        fi
    fi
}

# Check Docker daemon
check_docker() {
    print_status "Checking Docker daemon..."
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        echo "Please start Docker and run this script again."
        exit 1
    fi
    
    print_success "Docker daemon is running"
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Pull required images
    print_status "Pulling base images..."
    docker-compose pull postgres redis
    
    # Build application images
    print_status "Building application images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are healthy
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "Up"; then
            break
        fi
        
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Services failed to start properly"
        print_status "Checking service logs..."
        docker-compose logs
        exit 1
    fi
    
    print_success "Services started successfully"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    local max_attempts=30
    local attempt=1
    
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
    
    # Run migrations
    docker-compose exec -T backend alembic upgrade head
    print_success "Database migrations completed"
}

# Create demo data (optional)
create_demo_data() {
    read -p "Do you want to create demo data? (y/N): " create_demo
    
    if [[ $create_demo =~ ^[Yy]$ ]]; then
        print_status "Creating demo data..."
        
        # Create demo user
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
        print_success "Demo data created"
        echo ""
        echo "Demo login credentials:"
        echo "Email: demo@example.com"
        echo "Password: demo123456"
    fi
}

# Install development dependencies (optional)
install_dev_dependencies() {
    read -p "Do you want to install development dependencies? (y/N): " install_deps
    
    if [[ $install_deps =~ ^[Yy]$ ]]; then
        print_status "Installing development dependencies..."
        
        # Backend dependencies
        if command_exists python3 && command_exists pip; then
            print_status "Installing Python dependencies..."
            cd backend
            python3 -m venv venv 2>/dev/null || true
            source venv/bin/activate 2>/dev/null || true
            pip install -r requirements.txt >/dev/null 2>&1 || true
            cd ..
            print_success "Python dependencies installed"
        else
            print_warning "Python3/pip not found, skipping Python dependencies"
        fi
        
        # Frontend dependencies
        if command_exists node && command_exists npm; then
            print_status "Installing Node.js dependencies..."
            cd frontend
            npm install >/dev/null 2>&1 || true
            cd ..
            print_success "Node.js dependencies installed"
        else
            print_warning "Node.js/npm not found, skipping Node.js dependencies"
        fi
    fi
}

# Display service URLs
display_urls() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Service URLs:"
    echo "============="
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "API Documentation: http://localhost:8000/docs"
    echo "Database: localhost:5432"
    echo "Redis: localhost:6379"
    echo ""
    echo "Next steps:"
    echo "==========="
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Sign up for a new account or use demo credentials"
    echo "3. Configure your API keys in the settings"
    echo "4. Start generating leads!"
    echo ""
    echo "Useful commands:"
    echo "==============="
    echo "View logs: make logs"
    echo "Stop services: make stop"
    echo "Restart services: make restart"
    echo "Clean up: make clean"
    echo ""
}

# Configuration validation
validate_configuration() {
    print_status "Validating configuration..."
    
    local warnings=()
    
    # Check for important environment variables
    if grep -q "OPENAI_API_KEY=sk-your-openai-key-here" .env; then
        warnings+=("OpenAI API key not configured - AI features will not work")
    fi
    
    if grep -q "STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key" .env; then
        warnings+=("Stripe keys not configured - payment features will not work")
    fi
    
    if [ ${#warnings[@]} -ne 0 ]; then
        echo ""
        print_warning "Configuration warnings:"
        for warning in "${warnings[@]}"; do
            echo "  - $warning"
        done
        echo ""
        echo "To configure these later:"
        echo "1. Edit the .env file with your API keys"
        echo "2. Restart the services: make restart"
    fi
}

# Error handling
handle_error() {
    print_error "Setup failed at step: $1"
    echo ""
    echo "Troubleshooting:"
    echo "==============="
    echo "1. Check Docker is running: docker info"
    echo "2. Check logs: docker-compose logs"
    echo "3. Clean up and retry: make clean && ./scripts/setup.sh"
    echo "4. Check documentation: docs/DEPLOYMENT.md"
    echo ""
    echo "If the problem persists, please check:"
    echo "- GitHub Issues: https://github.com/your-repo/whop-lead-engine/issues"
    echo "- Documentation: https://github.com/your-repo/whop-lead-engine/docs"
    exit 1
}

# Main setup flow
main() {
    echo ""
    
    # Trap errors
    trap 'handle_error "Prerequisites check"' ERR
    check_prerequisites
    
    trap 'handle_error "Docker check"' ERR
    check_docker
    
    trap 'handle_error "Environment setup"' ERR
    setup_environment
    
    trap 'handle_error "Services startup"' ERR
    start_services
    
    trap 'handle_error "Database migrations"' ERR
    run_migrations
    
    trap 'handle_error "Demo data creation"' ERR
    create_demo_data
    
    trap 'handle_error "Development dependencies"' ERR
    install_dev_dependencies
    
    # Remove error trap for final steps
    trap - ERR
    
    validate_configuration
    display_urls
}

# Run main function
main "$@"