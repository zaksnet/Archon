"""
OpenAI API client implementation
"""

import json
from typing import List, Dict, Any, Optional, AsyncGenerator
import logging

from .base_client import BaseProviderClient, ClientConfig

logger = logging.getLogger(__name__)


class OpenAIClient(BaseProviderClient):
    """OpenAI API client for chat and embeddings"""
    
    def __init__(self, config: ClientConfig):
        super().__init__(config)
        if not config.base_url:
            config.base_url = "https://api.openai.com/v1"
        
        # Add OpenAI specific headers
        if not config.headers:
            config.headers = {}
        config.headers["Authorization"] = f"Bearer {config.api_key}"
        config.headers["Content-Type"] = "application/json"
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using OpenAI API"""
        
        url = f"{self.config.base_url}/chat/completions"
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            **kwargs
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        response = await self._make_request("POST", url, json=payload)
        
        # Extract the response in a standard format
        choice = response["choices"][0]
        return {
            "content": choice["message"]["content"],
            "role": choice["message"].get("role", "assistant"),
            "finish_reason": choice.get("finish_reason", "stop"),
            "usage": response.get("usage", {}),
            "model": response.get("model", model),
            "id": response.get("id")
        }
    
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
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        if chunk["choices"][0].get("delta", {}).get("content"):
                            yield {
                                "content": chunk["choices"][0]["delta"]["content"],
                                "finish_reason": chunk["choices"][0].get("finish_reason")
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
        """Stream chat completion using OpenAI API"""
        url = f"{self.config.base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
            **kwargs
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens
        return self._stream_chat_completion(url, payload)
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: str = "text-embedding-3-small",
        **kwargs
    ) -> List[List[float]]:
        """Generate embeddings using OpenAI API"""
        
        url = f"{self.config.base_url}/embeddings"
        
        # Process in batches if needed (OpenAI has limits)
        batch_size = 100
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            payload = {
                "model": model,
                "input": batch,
                **kwargs
            }
            
            response = await self._make_request("POST", url, json=payload)
            
            # Extract embeddings
            embeddings = [item["embedding"] for item in response["data"]]
            all_embeddings.extend(embeddings)
        
        return all_embeddings
    
    async def health_check(self) -> bool:
        """Check if OpenAI API is accessible"""
        try:
            url = f"{self.config.base_url}/models"
            response = await self._make_request("GET", url)
            return "data" in response and len(response["data"]) > 0
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models"""
        url = f"{self.config.base_url}/models"
        response = await self._make_request("GET", url)
        
        models = []
        for model in response.get("data", []):
            models.append({
                "id": model["id"],
                "created": model.get("created"),
                "owned_by": model.get("owned_by"),
                "type": self._determine_model_type(model["id"])
            })
        
        return models
    
    def _determine_model_type(self, model_id: str) -> str:
        """Determine the type of model from its ID"""
        if "embedding" in model_id:
            return "embedding"
        elif "whisper" in model_id:
            return "speech"
        elif "dall-e" in model_id or "vision" in model_id:
            return "vision"
        else:
            return "llm"