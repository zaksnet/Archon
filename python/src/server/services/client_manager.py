"""
Client Manager Service

Manages database and API client connections.
"""

import os
import re

from supabase import Client, create_client

from ..config.logfire_config import search_logger


def get_supabase_client() -> Client:
    """
    Get a Supabase client instance.

    Returns:
        Supabase client instance
    """
    raw_url = os.getenv("SUPABASE_URL", "")
    raw_key = os.getenv("SUPABASE_SERVICE_KEY", "")

    # Normalize to avoid common .env pitfalls (trailing spaces, quotes)
    url = raw_url.strip().strip('"').strip("'")
    key = raw_key.strip().strip('"').strip("'")

    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables"
        )

    try:
        # Basic shape diagnostics (no secrets leaked)
        key_len = len(key)
        key_shape = "jwt" if key.count(".") == 2 else "unknown"
        url_ok = bool(re.match(r"https://[^.]+\.supabase\.co", url))
        if not url_ok:
            search_logger.warning(
                f"SUPABASE_URL format unexpected: url='{url}'"
            )
        if key_len < 20 or key_shape != "jwt":
            search_logger.warning(
                f"SUPABASE_SERVICE_KEY shape unexpected: length={key_len}, dots={key.count('.')}"
            )

        # Let Supabase handle connection pooling internally
        client = create_client(url, key)

        # Extract project ID from URL for logging purposes only
        match = re.match(r"https://([^.]+)\.supabase\.co", url)
        if match:
            project_id = match.group(1)
            search_logger.info(f"Supabase client initialized - project_id={project_id}")

        return client
    except Exception as e:
        search_logger.error(f"Failed to create Supabase client: {e}")
        raise
