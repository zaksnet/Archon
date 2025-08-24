"""
Anthropic API client implementation
"""

import json
from typing import List, Dict, Any, Optional, AsyncGenerator
import logging

from .base_client import BaseProviderClient, ClientConfig

logger = logging.getLogger(__name__)


class AnthropicClient(BaseProviderClient):
    """Anthropic API client for Claude models"""
    
    def __init__(self, config: ClientConfig):
        super().__init__(config)
        if not config.base_url:
            config.base_url = "https://api.anthropic.com"
        
        # Add Anthropic specific headers
        if not config.headers:
            config.headers = {}
        config.headers["x-api-key"] = config.api_key
        config.headers["anthropic-version"] = "2023-06-01"
        config.headers["Content-Type"] = "application/json"
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using Anthropic API"""
        
        url = f"{self.config.base_url}/v1/messages"
        
        # Convert OpenAI format to Anthropic format
        anthropic_messages = self._convert_messages(messages)
        
        payload = {
            "model": model,
            "messages": anthropic_messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 1024,  # Anthropic requires max_tokens
            **kwargs
        }
        
        # Handle system message separately if present
        system_message = next((m["content"] for m in messages if m["role"] == "system"), None)
        if system_message:
            payload["system"] = system_message
            payload["messages"] = [m for m in anthropic_messages if m["role"] != "system"]
        
        response = await self._make_request("POST", url, json=payload)
        
        # Convert Anthropic response to standard format
        return {
            "content": response["content"][0]["text"],
            "role": "assistant",
            "finish_reason": response.get("stop_reason", "stop"),
            "usage": {
                "prompt_tokens": response.get("usage", {}).get("input_tokens", 0),
                "completion_tokens": response.get("usage", {}).get("output_tokens", 0),
                "total_tokens": (
                    response.get("usage", {}).get("input_tokens", 0) +
                    response.get("usage", {}).get("output_tokens", 0)
                )
            },
            "model": response.get("model", model),
            "id": response.get("id")
        }
    
    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Convert OpenAI message format to Anthropic format"""
        anthropic_messages = []
        
        for message in messages:
            role = message["role"]
            content = message["content"]
            
            # Anthropic uses "user" and "assistant" roles
            if role == "system":
                # System messages are handled separately in Anthropic
                continue
            elif role in ["user", "assistant"]:
                anthropic_messages.append({
                    "role": role,
                    "content": content
                })
            else:
                # Convert other roles to user
                anthropic_messages.append({
                    "role": "user",
                    "content": content
                })
        
        return anthropic_messages
    
    async def _stream_chat_completion(
        self,
        url: str,
        payload: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat completion responses"""
        if not self.session:
            raise RuntimeError("Client session not initialized")
        
        async with self.session.post(url, json=payload) as response:
            response.raise_for_status()
            
            async for line in response.content:
                line = line.decode('utf-8').strip()
                if line.startswith("data: "):
                    data = line[6:]
                    try:
                        chunk = json.loads(data)
                        if chunk["type"] == "content_block_delta":
                            yield {
                                "content": chunk["delta"]["text"],
                                "finish_reason": None
                            }
                        elif chunk["type"] == "message_stop":
                            yield {
                                "content": "",
                                "finish_reason": "stop"
                            }
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse streaming response: {data}")
    
    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat completion using Anthropic API"""
        url = f"{self.config.base_url}/v1/messages"
        anthropic_messages = self._convert_messages(messages)
        payload = {
            "model": model,
            "messages": anthropic_messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 1024,
            "stream": True,
            **kwargs
        }
        system_message = next((m["content"] for m in messages if m["role"] == "system"), None)
        if system_message:
            payload["system"] = system_message
            payload["messages"] = [m for m in anthropic_messages if m["role"] != "system"]
        return self._stream_chat_completion(url, payload)
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: str,
        **kwargs
    ) -> List[List[float]]:
        """Anthropic doesn't provide embeddings API"""
        raise NotImplementedError("Anthropic does not provide an embeddings API")
    
    async def health_check(self) -> bool:
        """Check if Anthropic API is accessible"""
        try:
            # Try a minimal API call
            url = f"{self.config.base_url}/v1/messages"
            payload = {
                "model": "claude-3-haiku-20240307",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 1
            }
            
            # Use a shorter timeout for health check
            old_timeout = self.config.timeout
            self.config.timeout = 5000
            
            try:
                await self._make_request("POST", url, json=payload)
                return True
            finally:
                self.config.timeout = old_timeout
                
        except Exception as e:
            logger.error(f"Anthropic health check failed: {e}")
            return False