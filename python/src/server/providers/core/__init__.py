"""
Core definitions for the provider system.

This module contains all shared enums and types with no external dependencies.
This ensures no circular imports can occur.
"""

from .enums import (
    # Service Types
    ServiceType,
    ProviderType,
    ModelType,
    
    # Status Types
    HealthStatus,
    CredentialType,
    RotationStatus,
    
    # Performance Types
    LatencyCategory,
    RuleType,
    
    # Management Types
    QuotaType,
    IncidentSeverity,
    IncidentStatus,
)

from .types import (
    # Type aliases and common types
    ProviderId,
    ModelId,
    CredentialId,
)

__all__ = [
    # Service Types
    'ServiceType',
    'ProviderType',
    'ModelType',
    
    # Status Types
    'HealthStatus',
    'CredentialType',
    'RotationStatus',
    
    # Performance Types
    'LatencyCategory',
    'RuleType',
    
    # Management Types
    'QuotaType',
    'IncidentSeverity',
    'IncidentStatus',
    
    # Type Aliases
    'ProviderId',
    'ModelId',
    'CredentialId',
]