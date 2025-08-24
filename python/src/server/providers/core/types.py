"""
Common type definitions for the provider system.

This module contains type aliases and common types used throughout the system.
"""

from typing import NewType, Any
from uuid import UUID

# Type aliases for better type hints
ProviderId = NewType('ProviderId', UUID)
ModelId = NewType('ModelId', UUID)
CredentialId = NewType('CredentialId', UUID)
RoutingRuleId = NewType('RoutingRuleId', UUID)
QuotaId = NewType('QuotaId', UUID)
IncidentId = NewType('IncidentId', UUID)

# Common type definitions
JsonDict = dict[str, Any]
Headers = dict[str, str]