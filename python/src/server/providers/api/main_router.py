"""
Main router for provider API endpoints

This module combines all provider-related route modules into a single router.
"""

from fastapi import APIRouter

from .provider_routes import router as provider_router
from .model_routes import router as model_router
from .usage_routes import router as usage_router

# Create main router with prefix
router = APIRouter(prefix="/api/providers", tags=["providers"])

# Include all sub-routers
# CRITICAL: Order matters for route matching - static routes MUST come before dynamic ones
# Routes with path parameters like /{provider_id} will match ANY path, so they must be last

# Static routes first
# Model management - has /models/ static route
router.include_router(model_router)

# Usage tracking - has /usage/summary static route
router.include_router(usage_router)

# Dynamic routes last
# Provider CRUD operations - includes /{provider_id} which matches anything
router.include_router(provider_router)