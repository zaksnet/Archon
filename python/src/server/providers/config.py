"""
Configuration settings for the provider system
"""

import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class ProviderConfig(BaseSettings):
    """Provider system configuration"""
    
    # Database
    database_url: str = Field(
        default="postgresql://localhost/providers",
        env="DATABASE_URL"
    )
    sql_echo: bool = Field(
        default=False,
        env="SQL_ECHO"
    )
    
    # Security
    encryption_key: Optional[str] = Field(
        default=None,
        env="ENCRYPTION_KEY",
        description="Fernet encryption key for credentials"
    )
    
    # Provider API Keys (optional - can be added via API)
    openai_api_key: Optional[str] = Field(
        default=None,
        env="OPENAI_API_KEY"
    )
    openai_org_id: Optional[str] = Field(
        default=None,
        env="OPENAI_ORG_ID"
    )
    anthropic_api_key: Optional[str] = Field(
        default=None,
        env="ANTHROPIC_API_KEY"
    )
    
    # Service Configuration
    max_retries: int = Field(
        default=3,
        env="PROVIDER_MAX_RETRIES"
    )
    retry_delay: float = Field(
        default=1.0,
        env="PROVIDER_RETRY_DELAY"
    )
    request_timeout: int = Field(
        default=30,
        env="PROVIDER_REQUEST_TIMEOUT"
    )
    
    # Health Check Settings
    health_check_interval: int = Field(
        default=300,  # 5 minutes
        env="HEALTH_CHECK_INTERVAL"
    )
    health_check_timeout: int = Field(
        default=10,
        env="HEALTH_CHECK_TIMEOUT"
    )
    
    # Usage Tracking
    usage_batch_size: int = Field(
        default=100,
        env="USAGE_BATCH_SIZE"
    )
    usage_retention_days: int = Field(
        default=90,
        env="USAGE_RETENTION_DAYS"
    )
    
    # Routing Configuration
    routing_cache_ttl: int = Field(
        default=60,  # 1 minute
        env="ROUTING_CACHE_TTL"
    )
    fallback_enabled: bool = Field(
        default=True,
        env="ROUTING_FALLBACK_ENABLED"
    )
    
    # Rate Limiting
    rate_limit_requests: int = Field(
        default=100,
        env="RATE_LIMIT_REQUESTS"
    )
    rate_limit_window: int = Field(
        default=60,  # 1 minute
        env="RATE_LIMIT_WINDOW"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Singleton instance
_config: Optional[ProviderConfig] = None


def get_config() -> ProviderConfig:
    """Get configuration instance"""
    global _config
    if _config is None:
        _config = ProviderConfig()
    return _config


def reset_config():
    """Reset configuration (mainly for testing)"""
    global _config
    _config = None