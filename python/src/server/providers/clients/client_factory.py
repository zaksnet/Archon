"""
Factory for creating provider API clients
"""

from typing import Optional, Dict, Any
import logging

from .base_client import BaseProviderClient, ClientConfig
from .openai_client import OpenAIClient
from .anthropic_client import AnthropicClient
from .google_client import GoogleClient
from ..core import ProviderType

logger = logging.getLogger(__name__)


class ProviderClientFactory:
    """Factory for creating provider-specific API clients"""
    
    _clients = {
        ProviderType.OPENAI: OpenAIClient,
        ProviderType.ANTHROPIC: AnthropicClient,
        ProviderType.GOOGLE: GoogleClient,
        ProviderType.GEMINI: GoogleClient,  # Both google and gemini use the same client
        # Add more as implemented
    }
    
    @classmethod
    def create_client(
        cls,
        provider_type: ProviderType,
        api_key: str,
        base_url: Optional[str] = None,
        timeout: int = 30000,
        max_retries: int = 3,
        headers: Optional[Dict[str, str]] = None
    ) -> BaseProviderClient:
        """
        Create a provider-specific API client
        
        Args:
            provider_type: Type of provider
            api_key: API key for authentication
            base_url: Optional base URL override
            timeout: Request timeout in milliseconds
            max_retries: Maximum number of retries
            headers: Additional headers
            
        Returns:
            Provider-specific client instance
            
        Raises:
            ValueError: If provider type is not supported
        """
        client_class = cls._clients.get(provider_type)
        
        if not client_class:
            raise ValueError(f"Unsupported provider type: {provider_type}")
        
        config = ClientConfig(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
            headers=headers
        )
        
        return client_class(config)
    
    @classmethod
    def register_client(cls, provider_type: ProviderType, client_class: type):
        """Register a new client implementation"""
        if not issubclass(client_class, BaseProviderClient):
            raise ValueError("Client class must inherit from BaseProviderClient")
        
        cls._clients[provider_type] = client_class
        logger.info(f"Registered client for provider type: {provider_type}")
    
    @classmethod
    def get_supported_providers(cls) -> list:
        """Get list of supported provider types"""
        return list(cls._clients.keys())