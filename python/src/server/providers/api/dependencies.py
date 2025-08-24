"""
Shared dependencies for provider API routes

This module provides common dependencies used across all provider route modules.
"""

from fastapi import HTTPException

from ..services.provider_service import ProviderService


def get_provider_service() -> ProviderService:
    """Dependency to get provider service with robust error reporting.

    If the underlying service cannot be constructed (e.g., Supabase client
    misconfiguration), return a clear and actionable HTTP error instead of an
    unhandled 500.
    """
    try:
        return ProviderService()
    except Exception as e:
        # Common cause: missing SUPABASE_URL / SUPABASE_SERVICE_KEY
        detail = (
            "Provider service unavailable. Please verify backend configuration: "
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set, and the database reachable. "
            f"Cause: {type(e).__name__}: {str(e)}"
        )
        # 503 Service Unavailable better reflects infra/config issues
        raise HTTPException(status_code=503, detail=detail)