"""
Google Gemini API client implementation
"""

import json
from typing import List, Dict, Any, Optional, AsyncGenerator
import logging

from .base_client import BaseProviderClient, ClientConfig

logger = logging.getLogger(__name__)


class GoogleClient(BaseProviderClient):
    """Google Gemini API client for chat and embeddings"""
    
    def __init__(self, config: ClientConfig):
        super().__init__(config)
        if not config.base_url:
            config.base_url = "https://generativelanguage.googleapis.com/v1beta"
        
        # Google uses API key in URL params, not headers
        self.api_key = config.api_key
        
        if not config.headers:
            config.headers = {}
        config.headers["Content-Type"] = "application/json"
    
    def _add_api_key(self, url: str) -> str:
        """Add API key to URL as query parameter"""
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}key={self.api_key}"
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using Google Gemini API"""
        
        # Google uses different endpoint structure
        url = f"{self.config.base_url}/models/{model}:generateContent"
        url = self._add_api_key(url)
        
        # Convert OpenAI-style messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "topP": kwargs.get("top_p", 0.95),
                "topK": kwargs.get("top_k", 40),
            }
        }
        
        if max_tokens:
            payload["generationConfig"]["maxOutputTokens"] = max_tokens
        
        response = await self._make_request("POST", url, json=payload)
        
        # Extract the response in a standard format
        candidate = response["candidates"][0]
        content = candidate["content"]["parts"][0]["text"]
        
        return {
            "content": content,
            "role": "assistant",
            "finish_reason": candidate.get("finishReason", "STOP"),
            "usage": {
                "prompt_tokens": response.get("usageMetadata", {}).get("promptTokenCount", 0),
                "completion_tokens": response.get("usageMetadata", {}).get("candidatesTokenCount", 0),
                "total_tokens": response.get("usageMetadata", {}).get("totalTokenCount", 0)
            },
            "model": model,
            "id": None  # Gemini doesn't provide response IDs
        }
    
    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat completion using Google Gemini API"""
        
        url = f"{self.config.base_url}/models/{model}:streamGenerateContent"
        url = self._add_api_key(url)
        
        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "topP": kwargs.get("top_p", 0.95),
                "topK": kwargs.get("top_k", 40),
            }
        }
        
        if max_tokens:
            payload["generationConfig"]["maxOutputTokens"] = max_tokens
        
        if not self.session:
            raise RuntimeError("Client session not initialized")
        
        async with self.session.post(url, json=payload) as response:
            response.raise_for_status()
            
            async for line in response.content:
                line = line.decode('utf-8').strip()
                if line:
                    try:
                        chunk = json.loads(line)
                        if "candidates" in chunk and chunk["candidates"]:
                            candidate = chunk["candidates"][0]
                            if "content" in candidate and "parts" in candidate["content"]:
                                text = candidate["content"]["parts"][0].get("text", "")
                                if text:
                                    yield {
                                        "content": text,
                                        "finish_reason": candidate.get("finishReason")
                                    }
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse streaming response: {line}")
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: str,
        **kwargs
    ) -> List[List[float]]:
        """Generate embeddings using Google's embedding API"""
        
        url = f"{self.config.base_url}/models/{model}:batchEmbedContents"
        url = self._add_api_key(url)
        
        # Prepare requests for batch embedding
        requests = []
        for text in texts:
            requests.append({
                "model": f"models/{model}",
                "content": {
                    "parts": [{"text": text}]
                },
                "taskType": kwargs.get("task_type", "RETRIEVAL_DOCUMENT")
            })
        
        payload = {"requests": requests}
        
        response = await self._make_request("POST", url, json=payload)
        
        # Extract embeddings
        embeddings = []
        for embedding in response.get("embeddings", []):
            embeddings.append(embedding["values"])
        
        return embeddings
    
    async def health_check(self) -> bool:
        """Check if the Google API is healthy"""
        try:
            # Use a simple list models endpoint for health check
            url = f"{self.config.base_url}/models"
            url = self._add_api_key(url)
            
            response = await self._make_request("GET", url)
            return "models" in response
        except Exception as e:
            logger.error(f"Google API health check failed: {e}")
            return False