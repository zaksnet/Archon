"""
Base client interface for provider API implementations
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncGenerator
from dataclasses import dataclass
import aiohttp
import logging

logger = logging.getLogger(__name__)


@dataclass
class ClientConfig:
    """Configuration for API clients"""
    api_key: str
    base_url: Optional[str] = None
    timeout: int = 30000
    max_retries: int = 3
    headers: Optional[Dict[str, str]] = None


class BaseProviderClient(ABC):
    """Base class for all provider API clients"""
    
    def __init__(self, config: ClientConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout / 1000),
            headers=self.config.headers or {}
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    @abstractmethod
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion"""
        pass
    
    @abstractmethod
    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat completion chunks"""
        pass
    
    @abstractmethod
    async def generate_embeddings(
        self,
        texts: List[str],
        model: str,
        **kwargs
    ) -> List[List[float]]:
        """Generate embeddings for texts"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is healthy"""
        pass
    
    async def _make_request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Make HTTP request with retry logic"""
        if not self.session:
            raise RuntimeError("Client session not initialized. Use async context manager.")
        
        retries = 0
        last_error = None
        
        while retries < self.config.max_retries:
            try:
                async with self.session.request(method, url, **kwargs) as response:
                    response.raise_for_status()
                    return await response.json()
            except aiohttp.ClientError as e:
                last_error = e
                retries += 1
                if retries < self.config.max_retries:
                    await self._wait_before_retry(retries)
                    logger.warning(f"Retry {retries}/{self.config.max_retries} for {url}: {e}")
        
        raise last_error or Exception("Request failed")
    
    async def _wait_before_retry(self, attempt: int):
        """Exponential backoff for retries"""
        import asyncio
        wait_time = min(2 ** attempt, 30)  # Cap at 30 seconds
        await asyncio.sleep(wait_time)