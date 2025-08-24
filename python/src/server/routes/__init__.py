"""
Type-safe route definitions system

This module provides centralized route definitions and utilities for
generating type-safe route bindings between backend and frontend.
"""

from .api_routes import APIRoutes

__all__ = ['APIRoutes']