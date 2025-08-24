"""
Integration tests for the unified provider system
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from uuid import uuid4

from src.server.providers.database import init_db, get_session
from src.server.providers.services.unified_provider_service import UnifiedProviderService
from src.server.providers.models.schemas import (
    ProviderCreate, CredentialCreate, ModelCreate,
    RoutingRuleCreate, ChatRequest, EmbeddingRequest,
    QuotaCreate, IncidentCreate
)
from src.server.providers.core import (
    ProviderType, ServiceType, ModelType, LatencyCategory,
    RuleType, QuotaType, IncidentSeverity
)
from src.server.providers.security.encryption import get_encryption


@pytest.fixture
async def db_session():
    """Create a test database session"""
    await init_db()
    async with get_session() as session:
        yield session


@pytest.fixture
async def service(db_session):
    """Create a service instance"""
    return UnifiedProviderService(db_session)


@pytest.fixture
async def test_provider(service):
    """Create a test provider"""
    provider = await service.create_provider(
        ProviderCreate(
            name="test-openai",
            display_name="Test OpenAI",
            provider_type=ProviderType.OPENAI,
            service_types=[ServiceType.LLM, ServiceType.EMBEDDING],
            base_url="https://api.openai.com/v1",
            is_active=True,
            is_primary=True
        )
    )
    return provider


class TestProviderLifecycle:
    """Test complete provider lifecycle"""
    
    async def test_create_provider(self, service):
        """Test creating a new provider"""
        provider = await service.create_provider(
            ProviderCreate(
                name="test-provider",
                display_name="Test Provider",
                provider_type=ProviderType.OPENAI,
                service_types=[ServiceType.LLM],
                base_url="https://api.test.com"
            )
        )
        
        assert provider.id is not None
        assert provider.name == "test-provider"
        assert provider.is_active is True
        assert ServiceType.LLM in provider.service_types
    
    async def test_update_provider(self, service, test_provider):
        """Test updating a provider"""
        updated = await service.update_provider(
            test_provider.id,
            {"display_name": "Updated Name", "is_primary": False}
        )
        
        assert updated.display_name == "Updated Name"
        assert updated.is_primary is False
    
    async def test_list_providers(self, service, test_provider):
        """Test listing providers with filters"""
        providers = await service.list_providers(
            service_type=ServiceType.LLM,
            is_active=True
        )
        
        assert len(providers) > 0
        assert any(p.id == test_provider.id for p in providers)
    
    async def test_delete_provider(self, service, test_provider):
        """Test deleting (deactivating) a provider"""
        success = await service.delete_provider(test_provider.id)
        assert success is True
        
        provider = await service.get_provider(test_provider.id)
        assert provider.is_active is False


class TestCredentialManagement:
    """Test credential operations"""
    
    async def test_add_credential(self, service, test_provider):
        """Test adding encrypted credentials"""
        credential = await service.add_credential(
            CredentialCreate(
                provider_id=test_provider.id,
                credential_type="api_key",
                credential_name="test_key",
                credential_value="sk-test123",
                api_key_header="Authorization",
                api_key_prefix="Bearer "
            )
        )
        
        assert credential.id is not None
        assert credential.credential_name == "test_key"
        # Value should be encrypted
        assert credential.encrypted_value != "sk-test123"
    
    async def test_rotate_credential(self, service, test_provider):
        """Test rotating credentials"""
        # Add initial credential
        credential = await service.add_credential(
            CredentialCreate(
                provider_id=test_provider.id,
                credential_type="api_key",
                credential_name="rotate_test",
                credential_value="old-key"
            )
        )
        
        # Rotate it
        rotated = await service.rotate_credential(
            credential.id,
            "new-key"
        )
        
        assert rotated.id == credential.id
        assert rotated.encrypted_value != credential.encrypted_value
        assert rotated.last_rotated > credential.created_at


class TestModelManagement:
    """Test model operations"""
    
    async def test_add_model(self, service, test_provider):
        """Test adding a model to a provider"""
        model = await service.add_model(
            ModelCreate(
                provider_id=test_provider.id,
                model_id="gpt-4",
                model_name="GPT-4",
                model_type=ModelType.LLM,
                model_family="gpt",
                context_window=8192,
                max_output_tokens=4096,
                input_price_per_1k=0.03,
                output_price_per_1k=0.06,
                latency_category=LatencyCategory.STANDARD,
                supports_streaming=True,
                supports_functions=True,
                is_available=True
            )
        )
        
        assert model.id is not None
        assert model.model_id == "gpt-4"
        assert model.context_window == 8192
    
    async def test_list_models(self, service, test_provider):
        """Test listing models with filters"""
        # Add a model first
        await service.add_model(
            ModelCreate(
                provider_id=test_provider.id,
                model_id="test-model",
                model_name="Test Model",
                model_type=ModelType.LLM
            )
        )
        
        models = await service.list_models(
            provider_id=test_provider.id,
            model_type=ModelType.LLM,
            is_available=True
        )
        
        assert len(models) > 0
        assert all(m.model_type == ModelType.LLM for m in models)


class TestRoutingRules:
    """Test routing configuration"""
    
    async def test_create_routing_rule(self, service, test_provider):
        """Test creating a routing rule"""
        # Create a second provider for fallback
        fallback = await service.create_provider(
            ProviderCreate(
                name="fallback-provider",
                display_name="Fallback",
                provider_type=ProviderType.ANTHROPIC,
                service_types=[ServiceType.LLM],
                base_url="https://api.anthropic.com"
            )
        )
        
        rule = await service.create_routing_rule(
            RoutingRuleCreate(
                rule_name="test-failover",
                rule_type=RuleType.PRIMARY_FALLBACK,
                service_type=ServiceType.LLM,
                provider_ids=[test_provider.id, fallback.id],
                is_active=True,
                priority=100,
                fallback_enabled=True,
                retry_on_failure=True,
                max_retries=3
            )
        )
        
        assert rule.id is not None
        assert rule.rule_name == "test-failover"
        assert len(rule.provider_ids) == 2
    
    async def test_list_routing_rules(self, service):
        """Test listing routing rules"""
        rules = await service.list_routing_rules(
            service_type=ServiceType.LLM,
            is_active=True
        )
        
        # Should have rules from initialization
        assert isinstance(rules, list)


class TestHealthMonitoring:
    """Test health check functionality"""
    
    async def test_check_provider_health(self, service, test_provider):
        """Test health check execution"""
        # Add a credential so health check can attempt connection
        await service.add_credential(
            CredentialCreate(
                provider_id=test_provider.id,
                credential_type="api_key",
                credential_name="health_test",
                credential_value="test-key"
            )
        )
        
        health = await service.check_provider_health(test_provider.id)
        
        assert health.provider_id == test_provider.id
        assert health.status in ["healthy", "degraded", "unhealthy"]
        assert health.response_time_ms >= 0
    
    async def test_get_health_history(self, service, test_provider):
        """Test retrieving health history"""
        # Perform a health check first
        await service.check_provider_health(test_provider.id)
        
        history = await service.get_health_history(test_provider.id, limit=10)
        
        assert isinstance(history, list)
        assert len(history) <= 10


class TestUsageTracking:
    """Test usage and cost tracking"""
    
    async def test_track_usage(self, service, test_provider):
        """Test usage tracking"""
        # Simulate some usage
        await service.track_usage(
            provider_id=test_provider.id,
            model_id="gpt-4",
            operation_type="chat_completion",
            input_tokens=100,
            output_tokens=50,
            total_cost=0.0075,
            response_time_ms=500
        )
        
        # Get usage metrics
        usage = await service.get_usage_metrics(
            test_provider.id,
            start_date=(datetime.now() - timedelta(days=1)).isoformat(),
            end_date=datetime.now().isoformat()
        )
        
        assert len(usage) > 0
        assert usage[0].total_requests > 0
    
    async def test_usage_summary(self, service):
        """Test cross-provider usage summary"""
        summary = await service.get_usage_summary(
            start_date=(datetime.now() - timedelta(days=30)).isoformat(),
            end_date=datetime.now().isoformat()
        )
        
        assert "total_cost" in summary
        assert "total_requests" in summary
        assert "providers" in summary


class TestQuotaManagement:
    """Test quota enforcement"""
    
    async def test_create_quota(self, service, test_provider):
        """Test creating usage quotas"""
        quota = await service.create_quota(
            QuotaCreate(
                provider_id=test_provider.id,
                quota_type=QuotaType.MONTHLY_COST,
                limit_value=1000.0,
                warning_threshold=0.8,
                action_on_exceed="throttle"
            )
        )
        
        assert quota.id is not None
        assert quota.limit_value == 1000.0
        assert quota.warning_threshold == 0.8
    
    async def test_list_quotas(self, service, test_provider):
        """Test listing quotas"""
        # Create a quota first
        await service.create_quota(
            QuotaCreate(
                provider_id=test_provider.id,
                quota_type=QuotaType.DAILY_REQUESTS,
                limit_value=10000
            )
        )
        
        quotas = await service.list_quotas(test_provider.id)
        
        assert len(quotas) > 0
        assert all(q.provider_id == test_provider.id for q in quotas)


class TestIncidentManagement:
    """Test incident tracking"""
    
    async def test_create_incident(self, service, test_provider):
        """Test creating an incident"""
        incident = await service.create_incident(
            IncidentCreate(
                provider_id=test_provider.id,
                incident_type="outage",
                severity=IncidentSeverity.CRITICAL,
                description="Provider API is down",
                affected_services=[ServiceType.LLM]
            )
        )
        
        assert incident.id is not None
        assert incident.severity == IncidentSeverity.CRITICAL
        assert incident.status == "open"
    
    async def test_update_incident(self, service, test_provider):
        """Test updating an incident"""
        # Create incident
        incident = await service.create_incident(
            IncidentCreate(
                provider_id=test_provider.id,
                incident_type="degraded",
                severity=IncidentSeverity.MINOR,
                description="Slow response times"
            )
        )
        
        # Update it
        updated = await service.update_incident(
            incident.id,
            {"status": "resolved", "resolution": "Issue fixed"}
        )
        
        assert updated.status == "resolved"
        assert updated.resolution == "Issue fixed"
        assert updated.resolved_at is not None
    
    async def test_list_incidents(self, service, test_provider):
        """Test listing incidents"""
        # Create an incident
        await service.create_incident(
            IncidentCreate(
                provider_id=test_provider.id,
                incident_type="test",
                severity=IncidentSeverity.MINOR,
                description="Test incident"
            )
        )
        
        incidents = await service.list_incidents(
            test_provider.id,
            include_resolved=False
        )
        
        assert len(incidents) > 0
        assert all(i.status == "open" for i in incidents)


class TestEncryption:
    """Test encryption functionality"""
    
    def test_encryption_roundtrip(self):
        """Test encryption and decryption"""
        encryption = get_encryption()
        
        plaintext = "super-secret-api-key"
        encrypted = encryption.encrypt(plaintext)
        decrypted = encryption.decrypt(encrypted)
        
        assert encrypted != plaintext
        assert decrypted == plaintext
    
    def test_key_validation(self):
        """Test key validation"""
        encryption = get_encryption()
        assert encryption.validate_key() is True
    
    def test_generate_key(self):
        """Test key generation"""
        from src.server.providers.security.encryption import CredentialEncryption
        
        key = CredentialEncryption.generate_key()
        assert len(key) == 44  # Fernet keys are 44 chars


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])