"""
Pydantic schemas for provider system API validation and serialization
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field
from ..core.enums import (
    ServiceType,
    ProviderType,
    ModelType,
    HealthStatus,
    CredentialType,
    LatencyCategory,
    QuotaType,
    IncidentSeverity,
    IncidentStatus,
)


# Enums are imported from ..core.enums as the single source of truth


# Provider Schemas
class ProviderBase(BaseModel):
    name: str
    display_name: str
    provider_type: ProviderType
    service_types: List[ServiceType]
    base_url: Optional[str] = None
    api_version: Optional[str] = None
    timeout_ms: int = 30000
    max_retries: int = 3
    retry_delay_ms: int = 1000
    is_active: bool = True
    is_primary: bool = False
    config: Dict[str, Any] = Field(default_factory=dict)
    headers: Dict[str, str] = Field(default_factory=dict)


class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    provider_type: Optional[ProviderType] = None
    service_types: Optional[List[ServiceType]] = None
    base_url: Optional[str] = None
    api_version: Optional[str] = None
    timeout_ms: Optional[int] = None
    max_retries: Optional[int] = None
    retry_delay_ms: Optional[int] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None


class ProviderResponse(ProviderBase):
    id: UUID
    health_status: HealthStatus = HealthStatus.UNKNOWN
    last_health_check: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None


# Model Schemas
class ModelBase(BaseModel):
    model_id: str
    model_name: str
    model_type: ModelType
    model_family: Optional[str] = None
    context_window: Optional[int] = None
    max_output_tokens: Optional[int] = None
    embedding_dimensions: Optional[int] = None
    supports_streaming: bool = False
    supports_functions: bool = False
    supports_vision: bool = False
    latency_category: Optional[LatencyCategory] = None
    rate_limit_rpm: Optional[int] = None
    rate_limit_tpd: Optional[int] = None
    input_price_per_1k: Optional[Decimal] = None
    output_price_per_1k: Optional[Decimal] = None
    is_available: bool = True


class ModelCreate(ModelBase):
    provider_id: UUID


class ModelUpdate(BaseModel):
    model_id: Optional[str] = None
    model_name: Optional[str] = None
    model_type: Optional[ModelType] = None
    model_family: Optional[str] = None
    context_window: Optional[int] = None
    max_output_tokens: Optional[int] = None
    embedding_dimensions: Optional[int] = None
    supports_streaming: Optional[bool] = None
    supports_functions: Optional[bool] = None
    supports_vision: Optional[bool] = None
    latency_category: Optional[LatencyCategory] = None
    rate_limit_rpm: Optional[int] = None
    rate_limit_tpd: Optional[int] = None
    input_price_per_1k: Optional[Decimal] = None
    output_price_per_1k: Optional[Decimal] = None
    is_available: Optional[bool] = None


class ModelResponse(ModelBase):
    id: UUID
    provider_id: UUID
    created_at: datetime
    updated_at: datetime


# Credential Schemas
class CredentialBase(BaseModel):
    credential_type: CredentialType
    credential_name: str
    api_key_prefix: Optional[str] = None
    api_key_header: str = "Authorization"
    is_active: bool = True
    expires_at: Optional[datetime] = None


class CredentialCreate(CredentialBase):
    provider_id: UUID
    credential_value: str  # Will be encrypted


class CredentialUpdate(BaseModel):
    credential_name: Optional[str] = None
    api_key_prefix: Optional[str] = None
    api_key_header: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class CredentialResponse(CredentialBase):
    id: UUID
    provider_id: UUID
    last_rotated: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    # Note: credential_value is never returned for security


# Usage and Monitoring Schemas
class UsageResponse(BaseModel):
    id: UUID
    provider_id: UUID
    date: datetime
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost: Decimal = Decimal("0")
    avg_latency_ms: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class UsageSummary(BaseModel):
    total_cost: Decimal
    total_requests: int
    total_input_tokens: int
    total_output_tokens: int
    providers: List[Dict[str, Any]]
    models: List[Dict[str, Any]]


class HealthCheckResult(BaseModel):
    id: UUID
    provider_id: UUID
    status: HealthStatus
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    checked_at: datetime


# Quota Schemas
class QuotaBase(BaseModel):
    quota_type: QuotaType
    quota_limit: Decimal
    warning_threshold_percent: int = 80
    critical_threshold_percent: int = 95
    action_on_limit: str = "block"
    is_active: bool = True


class QuotaCreate(QuotaBase):
    provider_id: UUID
    fallback_provider_id: Optional[UUID] = None


class QuotaUpdate(BaseModel):
    quota_limit: Optional[Decimal] = None
    warning_threshold_percent: Optional[int] = None
    critical_threshold_percent: Optional[int] = None
    action_on_limit: Optional[str] = None
    fallback_provider_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class QuotaResponse(QuotaBase):
    id: UUID
    provider_id: UUID
    fallback_provider_id: Optional[UUID] = None
    current_usage: Decimal = Decimal("0")
    period_start: datetime
    period_end: datetime
    created_at: datetime
    updated_at: datetime


# Incident Schemas
class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: IncidentSeverity
    status: IncidentStatus = IncidentStatus.OPEN
    affected_services: List[ServiceType] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IncidentCreate(IncidentBase):
    provider_id: UUID


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    affected_services: Optional[List[ServiceType]] = None
    metadata: Optional[Dict[str, Any]] = None


class IncidentResponse(IncidentBase):
    id: UUID
    provider_id: UUID
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# AI Operation Schemas
class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None
    provider_id: Optional[UUID] = None


class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    provider_id: UUID
    usage: Dict[str, int]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    provider_id: Optional[UUID] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    stream: bool = False


class ChatResponse(BaseModel):
    content: str
    model: str
    provider_id: UUID
    usage: Dict[str, int]
    finish_reason: Optional[str] = None