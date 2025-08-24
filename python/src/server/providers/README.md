# Unified Provider System

A comprehensive, enterprise-grade provider management system for AI/ML services with automatic failover, cost tracking, and health monitoring.

## Features

### Core Capabilities
- **Unified Architecture**: Single system for LLM, embedding, reranking, speech, and vision services
- **Multi-Provider Support**: OpenAI, Anthropic, Cohere, HuggingFace, and custom providers
- **Automatic Failover**: Intelligent routing with fallback providers
- **Cost Management**: Real-time usage tracking and quota enforcement
- **Security**: Fernet encryption for API credentials with rotation support
- **Health Monitoring**: Automatic health checks with incident tracking
- **Audit Trail**: Complete event logging for compliance

### Advanced Features
- **Load Balancing**: Round-robin, least-latency, and cost-optimized routing
- **Rate Limiting**: Provider-specific and global rate limits
- **Quota Management**: Hard/soft limits with automated actions
- **Model Catalog**: Comprehensive model metadata with pricing
- **Credential Rotation**: Zero-downtime credential updates
- **Usage Analytics**: Detailed metrics and cost analysis

## Architecture

### Database Schema
```
providers           - Provider configurations
provider_credentials - Encrypted API keys
provider_models     - Available models and capabilities  
routing_rules       - Traffic routing configuration
usage_tracking      - Request metrics and costs
quotas              - Usage limits and thresholds
health_checks       - Provider health history
incidents           - Outage and issue tracking
```

### Service Layer
- `UnifiedProviderService`: Core business logic (1200+ lines)
- `BaseProviderClient`: Abstract client interface
- `OpenAIClient`: OpenAI API implementation
- `AnthropicClient`: Anthropic API implementation
- `ClientFactory`: Dynamic client instantiation

### API Layer
- RESTful endpoints via FastAPI
- Comprehensive CRUD operations
- Health checks and monitoring
- Usage analytics endpoints

## Installation

### Prerequisites
```bash
# Python 3.11+
pip install -r requirements.txt

# PostgreSQL 14+
createdb providers
```

### Environment Setup
```bash
# Copy example configuration
cp .env.example .env

# Generate encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Add to .env
ENCRYPTION_KEY=<generated-key>
DATABASE_URL=postgresql://user:pass@localhost/providers
```

### Database Migration
```bash
# Run migration
psql -d providers -f migrations/20240822_add_providers_tables.sql

# Initialize with default providers
python src/server/providers/init_providers.py
```

## Usage

### Basic Provider Setup
```python
from providers import UnifiedProviderService

# Create provider
provider = await service.create_provider(
    ProviderCreate(
        name="openai-primary",
        provider_type=ProviderType.OPENAI,
        service_types=[ServiceType.LLM, ServiceType.EMBEDDING],
        base_url="https://api.openai.com/v1"
    )
)

# Add credentials
await service.add_credential(
    CredentialCreate(
        provider_id=provider.id,
        credential_type="api_key",
        credential_value="sk-..."
    )
)

# Add models
await service.add_model(
    ModelCreate(
        provider_id=provider.id,
        model_id="gpt-4",
        model_name="GPT-4",
        model_type=ModelType.LLM,
        context_window=8192
    )
)
```

### Routing Configuration
```python
# Setup automatic failover
await service.create_routing_rule(
    RoutingRuleCreate(
        rule_name="llm-failover",
        rule_type=RuleType.PRIMARY_FALLBACK,
        service_type=ServiceType.LLM,
        provider_ids=[primary_id, fallback_id],
        fallback_enabled=True
    )
)
```

### AI Operations
```python
# Chat completion with automatic routing
response = await service.chat_completion(
    ChatRequest(
        messages=[{"role": "user", "content": "Hello"}],
        model="gpt-4",
        temperature=0.7
    )
)

# Embeddings with failover
embeddings = await service.generate_embeddings(
    EmbeddingRequest(
        texts=["Document text"],
        model="text-embedding-3-small"
    )
)
```

### Monitoring
```python
# Health check
health = await service.check_provider_health(provider_id)

# Usage metrics
usage = await service.get_usage_metrics(
    provider_id,
    start_date="2024-01-01",
    end_date="2024-01-31"
)

# Quota management
await service.create_quota(
    QuotaCreate(
        provider_id=provider_id,
        quota_type="monthly_cost",
        limit_value=1000.0,
        action_on_exceed="throttle"
    )
)
```

## API Endpoints

### Provider Management
- `POST /api/providers` - Create provider
- `GET /api/providers/{id}` - Get provider
- `GET /api/providers` - List providers
- `PATCH /api/providers/{id}` - Update provider
- `DELETE /api/providers/{id}` - Delete provider

### Credential Management
- `POST /api/providers/{id}/credentials` - Add credential
- `POST /api/providers/credentials/{id}/rotate` - Rotate credential

### Model Management
- `POST /api/providers/{id}/models` - Add model
- `GET /api/providers/models` - List models

### Routing
- `POST /api/providers/routing-rules` - Create rule
- `GET /api/providers/routing-rules` - List rules

### Monitoring
- `POST /api/providers/{id}/health-check` - Check health
- `GET /api/providers/{id}/health-history` - Health history
- `GET /api/providers/{id}/usage` - Usage metrics
- `POST /api/providers/{id}/incidents` - Create incident

### AI Operations
- `POST /api/providers/chat` - Chat completion
- `POST /api/providers/embeddings` - Generate embeddings

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://localhost/providers
SQL_ECHO=false

# Security
ENCRYPTION_KEY=<fernet-key>

# Providers (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Service Settings
PROVIDER_MAX_RETRIES=3
PROVIDER_REQUEST_TIMEOUT=30
HEALTH_CHECK_INTERVAL=300
ROUTING_CACHE_TTL=60
```

## Testing

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=providers tests/

# Run specific test
pytest tests/test_providers.py::test_create_provider
```

## Security

### Credential Encryption
- All API keys encrypted with Fernet (AES-128)
- Master key rotation support
- Secure key derivation with PBKDF2

### Best Practices
- Store `ENCRYPTION_KEY` in secure vault
- Use environment variables for sensitive data
- Enable audit logging in production
- Implement rate limiting
- Regular credential rotation

## Performance

### Optimizations
- Connection pooling for database
- Async/await throughout
- Batch operations for usage tracking
- Caching for routing decisions
- Lazy loading of providers

### Scalability
- Horizontal scaling via load balancer
- Read replicas for analytics
- Time-series partitioning for metrics
- Queue-based health checks

## Troubleshooting

### Common Issues

**Provider not found**
- Check provider is active
- Verify provider_id is correct
- Ensure proper service_type

**Decryption failed**
- Verify ENCRYPTION_KEY matches
- Check credential wasn't corrupted
- Try credential rotation

**Routing failed**
- Verify routing rules exist
- Check provider health status
- Review fallback configuration

**Rate limit exceeded**
- Check quota settings
- Review usage patterns
- Adjust limits if needed

## Development

### Project Structure
```
providers/
├── api/                 # FastAPI endpoints
├── clients/            # Provider API clients
├── models/            
│   ├── db/            # SQLAlchemy models
│   └── schemas.py     # Pydantic schemas
├── security/          # Encryption utilities
├── services/          # Business logic
├── config.py          # Configuration
├── database.py        # Database setup
└── init_providers.py  # Initialization script
```

### Adding New Provider

1. Create client in `clients/`
2. Add to `ProviderType` enum
3. Update `ClientFactory`
4. Add default models in `init_providers.py`
5. Test integration