"""
Provider API Routers

This module contains the unified API router for provider management.
The routes are split into logical modules for better organization:
- provider_routes: Provider CRUD operations
- model_routes: Model management
- routing_routes: Routing rules management
- usage_routes: Usage tracking and metrics
"""

from .main_router import router as providers_router

# List of all provider API routers
routers = [
    providers_router,
]

__all__ = [
    'routers',
    'providers_router',
]
