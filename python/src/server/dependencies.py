"""
FastAPI dependency wiring.

Currently exposes `get_db` imported from `src.server.database` so existing
imports like `from src.server.dependencies import get_db` work.
"""
from .database import get_db, AsyncSession  # re-export for convenience

__all__ = ["get_db", "AsyncSession"]
