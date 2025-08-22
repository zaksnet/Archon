# Archon Development Makefile
# Cross-platform development environment management

# Shell flags for better error handling
SHELL := /bin/bash
.SHELLFLAGS := -ec

.PHONY: help dev dev-hybrid dev-docker dev-local prod backend frontend \
	build test test-frontend test-backend test-coverage clean clean-confirm \
	deep-clean deep-clean-confirm stop stop-local stop-prod logs status install \
	install-backend install-frontend check-env check-frontend-deps doctor health \
	lint lint-frontend lint-backend typecheck format pre-commit restart \
	watch-backend watch-mcp watch-agents shell-backend shell-mcp migrate backup-db \
	logs-archon-server logs-archon-mcp logs-archon-agents logs-archon-ui

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
	@echo "  make dev-local    - API server and frontend locally (MCP/Agents stay in Docker)"
	@echo ""
	@echo "Management:"
	@echo "  make stop         - Stop all Docker containers"
	@echo "  make stop-local   - Stop all local services"
	@echo "  make clean        - Stop and remove all containers and volumes"
	@echo "  make logs         - Show logs from all services"
	@echo "  make status       - Show status of all services"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests (frontend and backend)"
	@echo "  make test-frontend - Run frontend tests only"
	@echo "  make test-backend  - Run backend tests only"
	@echo ""
	@echo "Utilities:"
	@echo "  make doctor       - Check development environment setup"
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

# Verify required env vars exist - using Node.js for cross-platform compatibility
check-env:
	@node check-env.js

# Default dev target - hybrid mode
dev: dev-hybrid

# Hybrid development - backend in Docker, frontend local
dev-hybrid: stop-prod check-env check-frontend-deps
	@echo "Starting hybrid development environment..."
	@echo "Backend services in Docker, Frontend running locally"
	@LOG_LEVEL=DEBUG docker-compose --profile backend up -d --build
	@echo ""
	@echo "====================================================="
	@echo "Development Environment Ready!"
	@echo "====================================================="
	@echo ""
	@echo "Backend Services in Docker:"
	@echo "  API Server:     http://localhost:$${ARCHON_SERVER_PORT:-8181}"
	@echo "  MCP Server:     http://localhost:$${ARCHON_MCP_PORT:-8051}"
	@echo "  Agents Service: http://localhost:$${ARCHON_AGENTS_PORT:-8052}"
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
	docker-compose --profile full up -d --build
	@echo "All services running in Docker"
	@echo "UI available at: http://localhost:3737"

# Full local development - API server and frontend only (MCP/Agents run in Docker)
dev-local: check-env install
	@echo "Starting local development environment..."
	@echo "API Server and Frontend running locally"
	@echo "Note: MCP Server and Agents Service should run in Docker if needed"
	@echo ""
	@echo "======================================================"
	@echo "Local Development Environment"
	@echo "======================================================"
	@echo ""
	@echo "Starting API Server on port 8181..."
	@mkdir -p logs
	@cd python && uv run python -m src.server.main > ../logs/api-server.log 2>&1 &
	@sleep 3
	@echo ""
	@echo "Backend service started!"
	@echo ""
	@echo "API Server: http://localhost:8181"
	@echo ""
	@echo "Log file: ./logs/api-server.log"
	@echo ""
	@echo "Starting frontend on port 3737..."
	@echo ""
	@echo "To run MCP/Agents in Docker, use:"
	@echo "  docker-compose --profile backend up -d archon-mcp archon-agents"
	@echo ""
	@cd archon-ui-main && npm run dev

# Stop local services
stop-local:
	@echo "Stopping local services..."
	@pkill -f "python -m src.server.main" || true
	@pkill -f "vite" || true
	@lsof -ti:3737 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8181 | xargs kill -9 2>/dev/null || true
	@echo "Local services stopped"

# Production environment
prod:
	@echo "Starting production environment..."
	docker-compose --profile full up -d --build
	@echo "Production environment started"
	@echo "UI available at: http://localhost:3737"

# Start backend services only
backend:
	@echo "Starting backend services in Docker..."
	docker-compose --profile backend up -d --build

# Start frontend only (foreground)
frontend:
	@cd archon-ui-main && npm run dev

# Stop production containers if running
stop-prod:
	@echo "Checking for running production containers..."
	@docker-compose down 2>/dev/null || true
	@echo "Containers stopped"

# Build all Docker images
build:
	@echo "Building all Docker images..."
	docker-compose --profile full build

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
	@docker-compose --profile backend --profile frontend --profile full down || true
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
	@docker-compose logs -f

# Show logs from specific service
logs-%:
	@docker-compose logs -f $*

# Show status of all services
status:
	@echo "Service Status:"
	@echo "==============="
	-@docker-compose ps
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

# Lint all code (frontend and backend)
lint: lint-frontend lint-backend

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
	@docker-compose logs -f archon-server

# Watch MCP logs
watch-mcp:
	@docker-compose logs -f archon-mcp

# Watch agents logs
watch-agents:
	@docker-compose logs -f archon-agents

# Open shell in backend container
shell-backend:
	@docker-compose exec archon-server /bin/sh

# Open shell in MCP container
shell-mcp:
	@docker-compose exec archon-mcp /bin/sh

# Run database migrations
migrate:
	@echo "Running database migrations..."
	@cd python && uv run python -m src.server.db.migrate

# Backup database
backup-db:
	@echo "Creating database backup..."
	@docker-compose exec archon-server python -m src.server.db.backup

# Development environment validation
doctor:
	@echo "🔍 Checking development environment..."
	@echo ""
	@echo "=== Required Tools ==="
	@command -v docker >/dev/null 2>&1 && echo "✅ Docker: $$(docker --version | cut -d' ' -f3)" || echo "❌ Docker: Not installed"
	@command -v docker-compose >/dev/null 2>&1 && echo "✅ Docker Compose: $$(docker-compose --version | cut -d' ' -f4)" || echo "❌ Docker Compose: Not installed"
	@command -v node >/dev/null 2>&1 && echo "✅ Node.js: $$(node --version)" || echo "❌ Node.js: Not installed"
	@command -v npm >/dev/null 2>&1 && echo "✅ npm: $$(npm --version)" || echo "❌ npm: Not installed"
	@command -v python3 >/dev/null 2>&1 && echo "✅ Python: $$(python3 --version | cut -d' ' -f2)" || echo "❌ Python: Not installed"
	@command -v uv >/dev/null 2>&1 && echo "✅ uv: $$(uv --version | cut -d' ' -f2)" || echo "❌ uv: Not installed (needed for local development)"
	@command -v make >/dev/null 2>&1 && echo "✅ Make: $$(make --version | head -1 | cut -d' ' -f3)" || echo "❌ Make: Not installed"
	@echo ""
	@echo "=== Environment Variables ==="
	@test -f .env && echo "✅ .env file exists" || echo "❌ .env file missing (copy from .env.example)"
	@test -f .env && grep -q "SUPABASE_URL=" .env && echo "✅ SUPABASE_URL is set" || echo "❌ SUPABASE_URL not set"
	@test -f .env && grep -q "SUPABASE_SERVICE_KEY=" .env && echo "✅ SUPABASE_SERVICE_KEY is set" || echo "❌ SUPABASE_SERVICE_KEY not set"
	@echo ""
	@echo "=== Port Availability ==="
	@lsof -i :8181 >/dev/null 2>&1 && echo "⚠️  Port 8181 (API Server) is in use" || echo "✅ Port 8181 (API Server) is available"
	@lsof -i :8051 >/dev/null 2>&1 && echo "⚠️  Port 8051 (MCP Server) is in use" || echo "✅ Port 8051 (MCP Server) is available"
	@lsof -i :8052 >/dev/null 2>&1 && echo "⚠️  Port 8052 (Agents) is in use" || echo "✅ Port 8052 (Agents) is available"
	@lsof -i :3737 >/dev/null 2>&1 && echo "⚠️  Port 3737 (Frontend) is in use" || echo "✅ Port 3737 (Frontend) is available"
	@echo ""
	@echo "=== Docker Status ==="
	@docker info >/dev/null 2>&1 && echo "✅ Docker daemon is running" || echo "❌ Docker daemon is not running"
	@echo ""
	@echo "🏁 Environment check complete!"

.DEFAULT_GOAL := help