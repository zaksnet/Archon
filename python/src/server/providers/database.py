"""
Database configuration for the provider system using Supabase client
Consistent with the rest of the Archon project
"""

from ..services.client_manager import get_supabase_client

def get_providers_db():
    """Get Supabase client for provider operations"""
    return get_supabase_client()