"""
Initialize default providers and models in the database
"""

import asyncio
import os
from datetime import datetime
from typing import Optional
import logging
from pathlib import Path
from dotenv import load_dotenv

from .services.provider_service import ProviderService
from .models.schemas import (
    ProviderCreate, ModelCreate, CredentialCreate, RoutingRuleCreate
)
from .core.enums import (
    ServiceType, ProviderType, ModelType, LatencyCategory, CredentialType
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

"""
Load environment variables from the project .env file before any service init.
We assume the .env is located at the parent of this file's directory (the python/ root),
same as used in src/mcp/mcp_server.py
"""
current = Path(__file__).resolve()
# Parents: [.../providers, .../server, .../src, .../python, .../multi-provider-extension-feature]
parents = list(current.parents)
dotenv_candidates = []
try:
    dotenv_candidates.append(parents[2] / ".env")  # .../src/.env
    dotenv_candidates.append(parents[3] / ".env")  # .../python/.env
except IndexError:
    pass
loaded = False
for path in dotenv_candidates:
    if path.exists():
        load_dotenv(path, override=True)
        logger.info(f"Loaded environment from {path}")
        loaded = True
        break
if not loaded:
    logger.warning(
        f".env not found at any of: {', '.join(str(p) for p in dotenv_candidates)}; relying on process environment"
    )


async def seed_providers():
    """Seed the database with default providers"""
    service = ProviderService()
    
    # Check if providers already exist
    existing_providers = await service.list_providers()
    if existing_providers:
        logger.info(f"Found {len(existing_providers)} existing providers. Skipping seed.")
        return
    
    logger.info("Seeding default providers...")
    
    # ==================== OpenAI Provider ====================
    openai_provider = await service.create_provider(
        ProviderCreate(
            name="openai-primary",
            display_name="OpenAI (Primary)",
            provider_type=ProviderType.OPENAI,
            service_types=[ServiceType.LLM, ServiceType.EMBEDDING, ServiceType.VISION],
            base_url="https://api.openai.com/v1",
            is_active=True,
            is_primary=True,
            config={
                "api_version": "v1",
                "organization_id": os.getenv("OPENAI_ORG_ID")
            }
        )
    )
    logger.info(f"Created provider: {openai_provider.name}")
        
    # Add OpenAI API key if available
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        await service.add_credential(
            CredentialCreate(
                provider_id=openai_provider.id,
                credential_type=CredentialType.API_KEY,
                credential_name="primary_key",
                credential_value=openai_key,
                api_key_header="Authorization",
                api_key_prefix="Bearer ",
                is_active=True
            )
        )
        logger.info("Added OpenAI API key")
        
    # Add OpenAI models
    openai_models = [
        # LLM Models
        ("gpt-4-turbo-preview", "GPT-4 Turbo", ModelType.LLM, 128000, 0.01, 0.03, LatencyCategory.FAST),
        ("gpt-4", "GPT-4", ModelType.LLM, 8192, 0.03, 0.06, LatencyCategory.STANDARD),
        ("gpt-3.5-turbo", "GPT-3.5 Turbo", ModelType.LLM, 16385, 0.0005, 0.0015, LatencyCategory.FAST),
        # Embedding Models
        ("text-embedding-3-small", "Text Embedding 3 Small", ModelType.EMBEDDING, None, 0.00002, None, LatencyCategory.REALTIME),
        ("text-embedding-3-large", "Text Embedding 3 Large", ModelType.EMBEDDING, None, 0.00013, None, LatencyCategory.REALTIME),
        ("text-embedding-ada-002", "Text Embedding Ada v2", ModelType.EMBEDDING, None, 0.0001, None, LatencyCategory.REALTIME),
    ]
        
    for model_id, model_name, model_type, context, input_price, output_price, latency in openai_models:
        await service.add_model(
            ModelCreate(
                provider_id=openai_provider.id,
                model_id=model_id,
                model_name=model_name,
                model_type=model_type,
                model_family="gpt" if "gpt" in model_id else "embedding",
                context_window=context,
                embedding_dimensions=(
                    1536 if (model_type == ModelType.EMBEDDING and "small" in model_id)
                    else 3072 if (model_type == ModelType.EMBEDDING and "large" in model_id)
                    else None
                ),
                input_price_per_1k=input_price,
                output_price_per_1k=output_price,
                latency_category=latency,
                supports_streaming=model_type == ModelType.LLM,
                supports_functions=model_type == ModelType.LLM,
                is_available=True
            )
        )
    logger.info(f"Added {len(openai_models)} OpenAI models")
        
    # ==================== Anthropic Provider ====================
    anthropic_provider = await service.create_provider(
        ProviderCreate(
            name="anthropic-primary",
            display_name="Anthropic Claude",
            provider_type=ProviderType.ANTHROPIC,
            service_types=[ServiceType.LLM],
            base_url="https://api.anthropic.com",
            is_active=True,
            is_primary=False,
            config={
                "api_version": "2023-06-01"
            }
        )
    )
    logger.info(f"Created provider: {anthropic_provider.name}")
        
    # Add Anthropic API key if available
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        await service.add_credential(
            CredentialCreate(
                provider_id=anthropic_provider.id,
                credential_type=CredentialType.API_KEY,
                credential_name="primary_key",
                credential_value=anthropic_key,
                api_key_header="x-api-key",
                is_active=True
            )
        )
        logger.info("Added Anthropic API key")
        
    # Add Anthropic models
    anthropic_models = [
        ("claude-3-opus-20240229", "Claude 3 Opus", 200000, 0.015, 0.075, LatencyCategory.STANDARD),
        ("claude-3-sonnet-20240229", "Claude 3 Sonnet", 200000, 0.003, 0.015, LatencyCategory.FAST),
        ("claude-3-haiku-20240307", "Claude 3 Haiku", 200000, 0.00025, 0.00125, LatencyCategory.FAST),
    ]
        
    for model_id, model_name, context, input_price, output_price, latency in anthropic_models:
        await service.add_model(
            ModelCreate(
                provider_id=anthropic_provider.id,
                model_id=model_id,
                model_name=model_name,
                model_type=ModelType.LLM,
                model_family="claude",
                context_window=context,
                max_output_tokens=4096,
                input_price_per_1k=input_price,
                output_price_per_1k=output_price,
                latency_category=latency,
                supports_streaming=True,
                supports_vision=True,
                is_available=True
            )
        )
    logger.info(f"Added {len(anthropic_models)} Anthropic models")
        
    # ==================== Routing Rules ====================
    
    # LLM routing rule
    llm_providers = await service.list_providers(service_type=ServiceType.LLM)
    if llm_providers:
        await service.create_routing_rule(
            RoutingRuleCreate(
                rule_name="llm-primary-fallback",
                service_type=ServiceType.LLM,
                provider_ids=[p.id for p in sorted(llm_providers, key=lambda x: x.is_primary, reverse=True)],
                is_active=True,
                priority=100,
                fallback_enabled=True,
                retry_on_failure=True
            )
        )
        logger.info("Created LLM routing rule")
    
    # Embedding routing rule
    embedding_providers = await service.list_providers(service_type=ServiceType.EMBEDDING)
    if embedding_providers:
        await service.create_routing_rule(
            RoutingRuleCreate(
                rule_name="embedding-primary-fallback",
                service_type=ServiceType.EMBEDDING,
                provider_ids=[p.id for p in sorted(embedding_providers, key=lambda x: x.is_primary, reverse=True)],
                is_active=True,
                priority=100,
                fallback_enabled=True,
                retry_on_failure=True
            )
        )
        logger.info("Created embedding routing rule")
    
    logger.info("Provider initialization complete!")


async def main():
    """Main initialization function"""
    logger.info("Initializing provider system...")
    await seed_providers()
    logger.info("Initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())