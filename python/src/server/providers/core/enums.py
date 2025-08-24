"""
Central enum definitions for the provider system.

This is the SINGLE SOURCE OF TRUTH for all enums.
No other file should define these enums.
"""

from enum import Enum


# ==================== Service Types ====================

class ServiceType(str, Enum):
    """Types of AI services a provider can offer"""
    LLM = "llm"
    EMBEDDING = "embedding"
    RERANKING = "reranking"
    SPEECH = "speech"
    VISION = "vision"
    MULTIMODAL = "multimodal"


class ProviderType(str, Enum):
    """Types of AI providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"
    HUGGINGFACE = "huggingface"
    OLLAMA = "ollama"
    GOOGLE = "google"
    GEMINI = "gemini"
    MISTRAL = "mistral"
    CUSTOM = "custom"


class ModelType(str, Enum):
    """Types of AI models"""
    LLM = "llm"
    EMBEDDING = "embedding"
    RERANKING = "reranking"
    SPEECH_TO_TEXT = "speech_to_text"
    TEXT_TO_SPEECH = "text_to_speech"
    IMAGE_GENERATION = "image_generation"
    IMAGE_ANALYSIS = "image_analysis"


# ==================== Status Types ====================

class HealthStatus(str, Enum):
    """Health status of a provider"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class CredentialType(str, Enum):
    """Types of authentication credentials"""
    API_KEY = "api_key"
    OAUTH_TOKEN = "oauth_token"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"
    CUSTOM = "custom"


class RotationStatus(str, Enum):
    """Status of credential rotation"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


# ==================== Performance Types ====================

class LatencyCategory(str, Enum):
    """Latency categories for models"""
    REALTIME = "realtime"      # < 100ms
    FAST = "fast"              # 100-500ms
    STANDARD = "standard"      # 500-2000ms
    SLOW = "slow"              # > 2000ms


class RuleType(str, Enum):
    """Types of routing rules"""
    PRIMARY_FALLBACK = "primary_fallback"
    ROUND_ROBIN = "round_robin"
    LEAST_COST = "least_cost"
    LEAST_LATENCY = "least_latency"
    WEIGHTED = "weighted"
    CONDITIONAL = "conditional"
    COST_OPTIMIZED = "cost_optimized"
    CUSTOM = "custom"


# ==================== Management Types ====================

class QuotaType(str, Enum):
    """Types of usage quotas"""
    MONTHLY_COST = "monthly_cost"
    DAILY_COST = "daily_cost"
    MONTHLY_REQUESTS = "monthly_requests"
    DAILY_REQUESTS = "daily_requests"
    MONTHLY_TOKENS = "monthly_tokens"
    DAILY_TOKENS = "daily_tokens"
    HOURLY_REQUESTS = "hourly_requests"
    CONCURRENT_REQUESTS = "concurrent_requests"


class IncidentSeverity(str, Enum):
    """Severity levels for incidents"""
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    INFORMATIONAL = "informational"


class IncidentStatus(str, Enum):
    """Status of an incident"""
    OPEN = "open"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    CLOSED = "closed"