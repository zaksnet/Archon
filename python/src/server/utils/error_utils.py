"""
Error handling utilities for consistent error formatting across the API.
"""

from typing import Any, Dict


def format_supabase_error(e: Exception) -> Dict[str, Any]:
    """
    Format a Supabase error with full details for better debugging.
    
    Args:
        e: The exception that occurred
        
    Returns:
        Dictionary with formatted error details
    """
    error_detail = {
        "error": str(e),
        "error_type": type(e).__name__,
        "full_error": repr(e)
    }
    
    # If it's a Supabase error, include additional details
    if hasattr(e, 'message'):
        error_detail["supabase_message"] = e.message
    if hasattr(e, 'details'):
        error_detail["supabase_details"] = e.details
    if hasattr(e, 'hint'):
        error_detail["supabase_hint"] = e.hint
    if hasattr(e, 'code'):
        error_detail["supabase_code"] = e.code
    
    return error_detail
