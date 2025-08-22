# Archon Makefile - Simple, Secure, Cross-Platform
SHELL := /bin/bash
.SHELLFLAGS := -ec

.PHONY: help dev dev-docker stop test lint clean install check

help:
	@echo "Archon Development Commands"
	@echo "==========================="
	@echo "  make dev        - Backend in Docker, frontend local (recommended)"
	@echo "  make dev-docker - Everything in Docker"
	@echo "  make stop       - Stop all services"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linters"
	@echo "  make clean      - Remove containers and volumes"
	@echo "  make install    - Install dependencies"
	@echo "  make check      - Check environment setup"

# Install dependencies
install:
	@echo "Installing dependencies..."
	@cd archon-ui-main && npm install
	@cd python && uv sync
	@echo "✓ Dependencies installed"

# Check environment
check:
	@echo "Checking environment..."
	@node check-env.js
	@echo "Checking Docker..."
	@docker --version > /dev/null 2>&1 && echo "✓ Docker installed" || echo "✗ Docker not found"
	@docker-compose --version > /dev/null 2>&1 && echo "✓ Docker Compose installed" || echo "✗ Docker Compose not found"

# Hybrid development (recommended)
dev: check
	@echo "Starting hybrid development..."
	@echo "Backend: Docker | Frontend: Local with hot reload"
	@docker-compose --profile backend up -d --build
	@echo "Backend running at http://localhost:8181"
	@echo "Starting frontend..."
	@cd archon-ui-main && npm run dev

# Full Docker development
dev-docker: check
	@echo "Starting full Docker environment..."
	@docker-compose --profile full up -d --build
	@echo "✓ All services running"
	@echo "Frontend: http://localhost:3737"
	@echo "API: http://localhost:8181"

# Stop all services
stop:
	@echo "Stopping all services..."
	@docker-compose --profile backend --profile frontend --profile full down
	@echo "✓ Services stopped"

# Run tests
test:
	@echo "Running frontend tests..."
	@cd archon-ui-main && npm test
	@echo "Running backend tests..."
	@cd python && uv run pytest

# Run linters
lint:
	@echo "Linting frontend..."
	@cd archon-ui-main && npm run lint
	@echo "Linting backend..."
	@cd python && uv run ruff check --fix

# Clean everything (with confirmation)
clean:
	@echo "⚠️  This will remove all containers and volumes"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v --remove-orphans; \
		echo "✓ Cleaned"; \
	else \
		echo "Cancelled"; \
	fi

.DEFAULT_GOAL := help