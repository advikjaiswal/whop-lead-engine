# Whop Lead Engine - Development and Deployment Commands

.PHONY: help install dev build test clean deploy-dev deploy-prod

# Default target
help:
	@echo "Whop Lead Engine - Available Commands"
	@echo "===================================="
	@echo "install       - Install all dependencies"
	@echo "dev           - Start development environment"
	@echo "build         - Build production containers"
	@echo "test          - Run tests"
	@echo "clean         - Clean up containers and volumes"
	@echo "deploy-dev    - Deploy to development environment"
	@echo "deploy-prod   - Deploy to production environment"
	@echo "logs          - Show logs from all services"
	@echo "shell-backend - Open shell in backend container"
	@echo "shell-frontend - Open shell in frontend container"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Dependencies installed successfully!"

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose up --build

# Development with logs
dev-logs:
	@echo "Starting development environment with logs..."
	docker-compose up --build --force-recreate

# Build production containers
build:
	@echo "Building production containers..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && python -m pytest tests/ -v
	@echo "Running frontend tests..."
	cd frontend && npm test

# Clean up
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v
	docker system prune -f

# Deploy to development
deploy-dev:
	@echo "Deploying to development environment..."
	docker-compose -f docker-compose.yml up -d --build

# Deploy to production
deploy-prod:
	@echo "Deploying to production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Show logs
logs:
	docker-compose logs -f

# Backend shell
shell-backend:
	docker-compose exec backend bash

# Frontend shell
shell-frontend:
	docker-compose exec frontend sh

# Database migration
migrate:
	@echo "Running database migrations..."
	docker-compose exec backend alembic upgrade head

# Create new migration
migration:
	@echo "Creating new migration..."
	@read -p "Enter migration message: " message; \
	docker-compose exec backend alembic revision --autogenerate -m "$$message"

# Backup database
backup-db:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres whop_lead_engine > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Restore database
restore-db:
	@read -p "Enter backup file path: " file; \
	docker-compose exec -T postgres psql -U postgres whop_lead_engine < $$file

# Run specific service
run-backend:
	docker-compose up backend postgres redis -d

run-frontend:
	docker-compose up frontend -d

# Stop all services
stop:
	docker-compose stop

# Restart all services
restart:
	docker-compose restart

# Show status
status:
	docker-compose ps

# Install pre-commit hooks
install-hooks:
	@echo "Installing pre-commit hooks..."
	pip install pre-commit
	pre-commit install

# Format code
format:
	@echo "Formatting backend code..."
	cd backend && black . && isort .
	@echo "Formatting frontend code..."
	cd frontend && npm run format

# Lint code
lint:
	@echo "Linting backend code..."
	cd backend && flake8 . && mypy .
	@echo "Linting frontend code..."
	cd frontend && npm run lint

# Security scan
security:
	@echo "Running security scans..."
	cd backend && safety check
	cd frontend && npm audit

# Performance test
perf-test:
	@echo "Running performance tests..."
	cd backend && python scripts/performance_test.py