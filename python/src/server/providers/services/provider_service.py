"""
Provider service using Supabase client for database operations
"""

from typing import List, Optional, Dict, Any
from decimal import Decimal
from uuid import UUID
import logging
import asyncio

from ..database import get_providers_db
from ..models.schemas import (
    ProviderCreate, ProviderUpdate, ProviderResponse,
    ModelCreate, ModelUpdate, ModelResponse,
    CredentialCreate, CredentialUpdate, CredentialResponse,
    UsageResponse, UsageSummary,
    QuotaCreate, QuotaUpdate, QuotaResponse,
    HealthCheckResult,
    IncidentCreate, IncidentUpdate, IncidentResponse,
)
from ..core.enums import ServiceType, ModelType, LatencyCategory

logger = logging.getLogger(__name__)


class ProviderService:
    """Service for managing providers using Supabase"""
    
    def __init__(self):
        self.supabase = get_providers_db()
    
    async def _run(self, func):
        """Run a blocking Supabase call in a thread to avoid blocking the event loop."""
        return await asyncio.to_thread(func)
    
    # ==================== Provider Management ====================
    
    async def create_provider(self, provider_data: ProviderCreate) -> ProviderResponse:
        """Create a new provider"""
        try:
            response = await self._run(lambda: self.supabase.table('providers').insert(provider_data.model_dump()).execute())
            return ProviderResponse(**response.data[0])
        except Exception as e:
            logger.error(f"Failed to create provider: {e}")
            raise
    
    async def get_provider(self, provider_id: UUID) -> Optional[ProviderResponse]:
        """Get a provider by ID"""
        try:
            response = await self._run(lambda: self.supabase.table('providers').select('*').eq('id', str(provider_id)).execute())
            if response.data:
                return ProviderResponse(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get provider {provider_id}: {e}")
            raise
    
    async def list_providers(self, is_active: Optional[bool] = None, service_type: Optional[ServiceType] = None) -> List[ProviderResponse]:
        """List providers with optional filters"""
        try:
            query = self.supabase.table('providers').select('*')
            
            if is_active is not None:
                query = query.eq('is_active', is_active)
            
            response = await self._run(lambda: query.execute())
            items = response.data
            if service_type is not None:
                # In-memory filter for providers offering this service type
                # DB stores strings, while our input is an Enum
                items = [it for it in items if service_type.value in (it.get('service_types') or [])]
            return [ProviderResponse(**item) for item in items]
        except Exception as e:
            logger.error(f"Failed to list providers: {e}")
            raise
    
    async def update_provider(self, provider_id: UUID, update_data: ProviderUpdate) -> Optional[ProviderResponse]:
        """Update a provider"""
        try:
            # Only include non-None values in the update
            update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
            
            response = await self._run(lambda: self.supabase.table('providers').update(update_dict).eq('id', str(provider_id)).execute())
            if response.data:
                return ProviderResponse(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to update provider {provider_id}: {e}")
            raise
    
    async def delete_provider(self, provider_id: UUID) -> bool:
        """Soft delete a provider by setting is_active to False"""
        try:
            response = await self._run(lambda: self.supabase.table('providers').update({'is_active': False}).eq('id', str(provider_id)).execute())
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Failed to delete provider {provider_id}: {e}")
            raise
    
    # ==================== Model Management ====================
    
    async def add_model(self, model_data: ModelCreate) -> ModelResponse:
        """Add a model to a provider"""
        try:
            response = await self._run(lambda: self.supabase.table('provider_models').insert(model_data.model_dump()).execute())
            return ModelResponse(**response.data[0])
        except Exception as e:
            logger.error(f"Failed to add model: {e}")
            raise

    # ==================== Credential Management ====================
    
    async def add_credential(self, credential: CredentialCreate) -> CredentialResponse:
        """Add a credential for a provider"""
        try:
            response = await self._run(lambda: self.supabase.table('provider_credentials').insert(credential.model_dump()).execute())
            return CredentialResponse(**response.data[0])
        except Exception as e:
            logger.error(f"Failed to add credential: {e}")
            raise
    
    async def list_models(self, provider_id: Optional[UUID] = None, is_available: Optional[bool] = None, model_type: Optional[ModelType] = None) -> List[ModelResponse]:
        """List models with optional filters"""
        try:
            query = self.supabase.table('provider_models').select('*')
            
            if provider_id:
                query = query.eq('provider_id', str(provider_id))
            if is_available is not None:
                query = query.eq('is_available', is_available)
            
            response = await self._run(lambda: query.execute())
            rows = response.data
            if model_type is not None:
                # Compare DB string with enum value
                rows = [r for r in rows if r.get('model_type') == model_type.value]
            normalized: List[ModelResponse] = []
            for item in rows:
                payload = dict(item)
                # Normalize latency_category to core LatencyCategory values
                lc = payload.get('latency_category')
                if isinstance(lc, str):
                    norm = lc.lower()
                    # Map legacy 'medium' -> 'standard'
                    if norm == 'medium':
                        norm = 'standard'
                    # Acceptable values according to core enum
                    if norm in {'realtime', 'fast', 'standard', 'slow'}:
                        payload['latency_category'] = LatencyCategory(norm)
                    else:
                        logger.warning(
                            "Invalid latency_category '%s' on model '%s'; setting to None",
                            lc, payload.get('model_name', '<unknown>')
                        )
                        payload['latency_category'] = None
                normalized.append(ModelResponse(**payload))
            return normalized
        except Exception as e:
            # Graceful fallback for missing table during local/dev: return empty list
            msg = str(e)
            if (
                'PGRST205' in msg
                or 'Could not find the table' in msg
                or 'JSON could not be generated' in msg
                or '<html>' in msg  # upstream returned HTML error page (e.g., Cloudflare)
                or 'cloudflare' in msg.lower()
            ):
                logger.warning(
                    "Model list unavailable from Supabase; returning empty model list. "
                    f"Original error: {e}"
                )
                return []
            logger.error(f"Failed to list models: {e}")
            raise
    
    # ==================== Usage Tracking ====================
    
    async def get_usage_summary(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> UsageSummary:
        """Get usage summary across all providers"""
        try:
            # Get usage data
            usage_query = self.supabase.table('provider_usage').select('*')
            # Schema uses period_start / period_end
            if start_date:
                usage_query = usage_query.gte('period_start', start_date)
            if end_date:
                usage_query = usage_query.lte('period_end', end_date)
            usage_response = await self._run(lambda: usage_query.execute())
            usage_data = usage_response.data or []
            
            # Calculate totals with Decimal for precision
            def _to_decimal(val) -> Decimal:
                if val is None or val == "":
                    return Decimal(0)
                # Convert via str to avoid binary FP artifacts if val is float
                return Decimal(str(val))
            # Migration defines estimated_cost, request_count, input_tokens, output_tokens
            total_cost: Decimal = sum((_to_decimal(row.get('estimated_cost')) for row in usage_data), Decimal(0))
            # Guard against None values coming from DB
            total_requests = sum(int(row.get('request_count') or 0) for row in usage_data)
            total_input_tokens = sum(int(row.get('input_tokens') or 0) for row in usage_data)
            total_output_tokens = sum(int(row.get('output_tokens') or 0) for row in usage_data)
            
            # Get provider and model lists
            providers_response = await self._run(lambda: self.supabase.table('providers').select('id,name,display_name').execute())
            models_response = await self._run(lambda: self.supabase.table('provider_models').select('id,model_name,provider_id').execute())
            
            return UsageSummary(
                total_cost=total_cost,
                total_requests=total_requests,
                total_input_tokens=total_input_tokens,
                total_output_tokens=total_output_tokens,
                providers=providers_response.data,
                models=models_response.data
            )
        except Exception as e:
            logger.error(f"Failed to get usage summary: {e}")
            raise
    
    async def get_usage_metrics(self, provider_id: UUID, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[UsageResponse]:
        """Get usage metrics for a provider"""
        try:
            query = self.supabase.table('provider_usage').select('*').eq('provider_id', str(provider_id))

            # Align with period_start/period_end
            if start_date:
                query = query.gte('period_start', start_date)
            if end_date:
                query = query.lte('period_end', end_date)

            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, query.execute)
            return [UsageResponse(**item) for item in response.data]
        except Exception as e:
            logger.error(f"Failed to get usage metrics for provider {provider_id}: {e}")
            raise
    
    # ==================== Active Provider Management ====================
    
    async def get_active_providers(self) -> Dict[str, Optional[UUID]]:
        """Get active providers for all service types"""
        try:
            response = await self._run(lambda: 
                self.supabase.table('provider_active_config')
                .select('*')
                .execute()
            )
            
            # Convert to dict with service_type as key
            result = {}
            for row in response.data:
                service_type = row['service_type']
                provider_id = row.get('provider_id')
                # Map to frontend expected keys
                if service_type == 'llm':
                    result['llm_provider_id'] = provider_id
                elif service_type == 'embedding':
                    result['embedding_provider_id'] = provider_id
                elif service_type == 'vision':
                    result['vision_provider_id'] = provider_id
                elif service_type == 'reranking':
                    result['reranking_provider_id'] = provider_id
                elif service_type == 'speech':
                    result['speech_provider_id'] = provider_id
            
            # Ensure all keys are present
            for key in ['llm_provider_id', 'embedding_provider_id', 'vision_provider_id', 
                       'reranking_provider_id', 'speech_provider_id']:
                if key not in result:
                    result[key] = None
                    
            return result
        except Exception as e:
            msg = str(e)
            if 'PGRST205' in msg or 'Could not find the table' in msg:
                logger.warning("provider_active_config table not found, returning empty config")
                return {
                    'llm_provider_id': None,
                    'embedding_provider_id': None,
                    'vision_provider_id': None,
                    'reranking_provider_id': None,
                    'speech_provider_id': None
                }
            logger.error(f"Failed to get active providers: {e}")
            raise
    
    async def set_active_provider(self, service_type: ServiceType, provider_id: UUID) -> bool:
        """Set active provider for a service type"""
        try:
            # Verify provider exists and supports the service type
            provider_response = await self._run(lambda:
                self.supabase.table('providers')
                .select('*')
                .eq('id', str(provider_id))
                .execute()
            )
            
            if not provider_response.data:
                raise ValueError(f"Provider {provider_id} not found")
            
            provider = provider_response.data[0]
            if service_type.value not in provider.get('service_types', []):
                raise ValueError(f"Provider {provider_id} does not support {service_type.value}")
            
            # Upsert the active provider config
            await self._run(lambda:
                self.supabase.table('provider_active_config')
                .upsert({
                    'service_type': service_type.value,
                    'provider_id': str(provider_id),
                    'updated_at': 'now()'
                })
                .execute()
            )
            
            return True
        except Exception as e:
            logger.error(f"Failed to set active provider: {e}")
            raise