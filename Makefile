# Archon Development Makefile
# Cross-platform development environment management

.PHONY: help dev dev-hybrid dev-docker prod build test clean clean-confirm deep-clean deep-clean-confirm stop logs status install check-env

# Default target - show help
help:
	@echo "Archon Development Environment"
	@echo "=============================="
	@echo ""
	@echo "Quick Start:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start hybrid dev environment (backend in Docker, frontend local)"
	@echo "  make prod         - Start production environment (all in Docker)"
	@echo ""
	@echo "Development Modes:"
	@echo "  make dev-hybrid   - Backend in Docker, frontend locally with HMR (default)"
	@echo "  make dev-docker   - Everything in Docker (slower frontend updates)"
	@echo ""
	@echo "Management:"
	@echo "  make stop         - Stop all running containers"
	@echo "  make clean        - Stop and remove all containers and volumes"
	@echo "  make logs         - Show logs from all services"
	@echo "  make status       - Show status of all services"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests (frontend and backend)"
	@echo "  make test-frontend - Run frontend tests only"
	@echo "  make test-backend  - Run backend tests only"
	@echo ""
	@echo "Individual Services:"
	@echo "  make frontend     - Start frontend only (local)"
	@echo "  make backend      - Start backend services only (Docker)"
	@echo ""

# Install all dependencies
install:
	@echo "Installing dependencies..."
	@cd archon-ui-main && npm install
	@cd python && uv sync
	@echo "Dependencies installed successfully!"

# Check and install frontend dependencies if needed
check-frontend-deps:
	@cd archon-ui-main && npm install --silent

# Default dev target - hybrid mode
dev: dev-hybrid

# Hybrid development - backend in Docker, frontend local
dev-hybrid: stop-prod check-frontend-deps
	@echo "Starting hybrid development environment..."
	@echo "Backend services in Docker, Frontend running locally"
	@docker-compose -p archon-backend -f docker-compose.backend.yml up -d --build
	@echo ""
	@echo "====================================================="
	@echo "Development Environment Ready!"
	@echo "====================================================="
	@echo ""
	@echo "Backend Services in Docker:"
	@echo "  API Server:     http://localhost:8181"
	@echo "  MCP Server:     http://localhost:8051"
	@echo "  Agents Service: http://localhost:8052"
	@echo ""
	@echo "Starting frontend server..."
	@echo ""
	@echo "Commands (in another terminal):"
	@echo "  make logs       - View all logs"
	@echo "  make stop       - Stop everything"
	@echo "  make status     - Check service status"
	@echo ""
	@cd archon-ui-main && npm run dev

# Full Docker development
dev-docker:
	@echo "Starting full Docker development environment..."
	docker-compose up -d --build
	@echo "All services running in Docker"
	@echo "UI available at: http://localhost:3737"

# Production environment
prod:
	@echo "Starting production environment..."
	docker-compose up -d --build
	@echo "Production environment started"
	@echo "UI available at: http://localhost:3737"

# Start backend services only
backend:
	@echo "Starting backend services in Docker..."
	docker-compose -p archon-backend -f docker-compose.backend.yml up -d --build

# Start frontend only (foreground)
frontend:
	@cd archon-ui-main && npm run dev

# Stop production containers if running
stop-prod:
	@echo "Checking for running production containers..."
	-@docker-compose down
	-@docker-compose -p archon-backend -f docker-compose.backend.yml down
	@echo "Containers stopped"

# Build all Docker images
build:
	@echo "Building all Docker images..."
	docker-compose build
	docker-compose -f docker-compose.backend.yml build

# Run all tests
test: test-frontend test-backend

# Run frontend tests
test-frontend:
	@echo "Running frontend tests..."
	@cd archon-ui-main && npm run test

# Run backend tests
test-backend:
	@echo "Running backend tests..."
	@cd python && uv run pytest

# Run frontend tests with coverage
test-coverage:
	@echo "Running frontend tests with coverage..."
	@cd archon-ui-main && npm run test:coverage

# Stop all containers
stop:
	@echo "Stopping all containers..."
	-@docker-compose down
	-@docker-compose -p archon-backend -f docker-compose.backend.yml down
	@echo "All services stopped"

# Clean everything (containers, volumes, node_modules)
clean:
	@echo ""
	@echo "========================================="
	@echo "⚠️  WARNING: DESTRUCTIVE OPERATION"
	@echo "========================================="
	@echo ""
	@echo "This command will PERMANENTLY DELETE:"
	@echo "  • All Docker containers"
	@echo "  • All Docker volumes (including database data)"
	@echo "  • All stored documents and embeddings"
	@echo "  • Docker build cache"
	@echo ""
	@echo "To proceed, run: make clean-confirm"
	@echo "To cancel, press Ctrl+C or do nothing"
	@echo ""

# Actual clean operation (requires explicit confirmation)
clean-confirm: stop
	@echo "Cleaning up everything..."
	-@docker-compose down -v --remove-orphans
	-@docker-compose -p archon-backend -f docker-compose.backend.yml down -v --remove-orphans
	@docker system prune -f
	@echo "Cleanup complete"

# Deep clean including dependencies
deep-clean:
	@echo ""
	@echo "========================================="
	@echo "⚠️  WARNING: COMPLETE RESET"
	@echo "========================================="
	@echo ""
	@echo "This command will PERMANENTLY DELETE:"
	@echo "  • Everything from 'make clean'"
	@echo "  • All npm dependencies (node_modules)"
	@echo "  • Python virtual environment"
	@echo ""
	@echo "You will need to run 'make install' after this."
	@echo ""
	@echo "To proceed, run: make deep-clean-confirm"
	@echo ""

# Actual deep clean operation
deep-clean-confirm: clean-confirm
	@echo "Performing deep clean..."
	@echo "Please manually delete archon-ui-main/node_modules and python/.venv if needed"
	@echo "Deep clean complete. Run 'make install' to reinstall dependencies."

# Show logs from all services
logs:
	@docker-compose -p archon-backend -f docker-compose.backend.yml logs -f

# Show logs from specific service
logs-%:
	@docker-compose -p archon-backend -f docker-compose.backend.yml logs -f $*

# Show status of all services
status:
	@echo "Service Status:"
	@echo "==============="
	-@docker-compose -p archon-backend -f docker-compose.backend.yml ps
	@echo ""
	@echo "Check http://localhost:3737 for frontend status"

# Restart all services
restart: stop dev

# Lint frontend code
lint-frontend:
	@cd archon-ui-main && npm run lint

# Lint backend code
lint-backend:
	@cd python && uv run ruff check

# Type check backend code
typecheck:
	@cd python && uv run mypy src/

# Format code
format:
	@cd python && uv run ruff format
	@cd archon-ui-main && npx prettier --write "src/**/*.{ts,tsx,js,jsx}"

# Run pre-commit checks
pre-commit: lint-frontend lint-backend typecheck test
	@echo "All pre-commit checks passed!"

# Docker health check
health:
	@echo "Checking service health..."
	@echo "API Server: http://localhost:8181/health"
	@echo "MCP Server: http://localhost:8051/health"
	@echo "Agents Service: http://localhost:8052/health"
	@echo "Frontend: http://localhost:3737"

# Watch backend logs
watch-backend:
	@docker-compose -p archon-backend -f docker-compose.backend.yml logs -f backend-server

# Watch MCP logs
watch-mcp:
	@docker-compose -p archon-backend -f docker-compose.backend.yml logs -f backend-mcp

# Watch agents logs
watch-agents:
	@docker-compose -p archon-backend -f docker-compose.backend.yml logs -f backend-agents

# Open shell in backend container
shell-backend:
	@docker-compose -p archon-backend -f docker-compose.backend.yml exec backend-server /bin/sh

# Open shell in MCP container
shell-mcp:
	@docker-compose -p archon-backend -f docker-compose.backend.yml exec backend-mcp /bin/sh

# Run database migrations
migrate:
	@echo "Running database migrations..."
	@cd python && uv run python -m src.server.db.migrate

# Backup database
backup-db:
	@echo "Creating database backup..."
	@docker-compose -p archon-backend -f docker-compose.backend.yml exec backend-server python -m src.server.db.backup

.DEFAULT_GOAL := help