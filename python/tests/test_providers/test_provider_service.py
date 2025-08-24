import asyncio
from uuid import UUID
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from src.server.providers.services.provider_service import ProviderService
from src.server.providers.models.schemas import ModelResponse
from src.server.providers.core.enums import ModelType, LatencyCategory


class _MockQuery:
    def __init__(self, data):
        self._data = data
    def select(self, *_a):
        return self
    def eq(self, *_a, **_k):
        return self
    def gte(self, *_a, **_k):
        return self
    def lte(self, *_a, **_k):
        return self
    def execute(self):
        return SimpleNamespace(data=self._data)


def _mk_supabase(model_rows):
    mock = MagicMock()
    def _table(name):
        if name == 'provider_models':
            return _MockQuery(model_rows)
        return _MockQuery([])
    mock.table.side_effect = _table
    return mock


@pytest.mark.asyncio
async def test_list_models_normalizes_latency_and_filters():
    # Prepare rows simulating DB payload
    rows = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "provider_id": "22222222-2222-2222-2222-222222222222",
            "model_id": "gpt-4",
            "model_name": "GPT-4",
            "model_type": "llm",
            "latency_category": "medium",  # should map -> standard
            "is_available": True,
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "provider_id": "22222222-2222-2222-2222-222222222222",
            "model_id": "weird",
            "model_name": "Weird",
            "model_type": "embedding",
            "latency_category": "invalid_value",  # should become None
            "is_available": False,
        },
    ]

    supabase = _mk_supabase(rows)

    with patch("src.server.providers.database.get_providers_db", return_value=supabase):
        svc = ProviderService()
        # filter by model_type
        result = await svc.list_models(model_type=ModelType.LLM)
        assert len(result) == 1
        m = result[0]
        assert isinstance(m, ModelResponse)
        assert m.latency_category == LatencyCategory.STANDARD
        # is_available filter (applied at DB level; our mock returns both but we pass is_available=True)
        result2 = await svc.list_models(is_available=True)
        # Both rows returned by mock, but service does not post-filter is_available; we only assert normalization preserved
        assert any(r.latency_category == LatencyCategory.STANDARD for r in result2)
        assert any(r.latency_category is None for r in result2)


@pytest.mark.asyncio
async def test_list_models_handles_missing_table_error_and_returns_empty(caplog):
    class _ErrQuery:
        def select(self, *_a):
            return self
        def execute(self):
            # Simulate Supabase PostgREST 205 error string
            raise Exception("PGRST205: Could not find the table provider_models")

    supabase = MagicMock()
    supabase.table.return_value = _ErrQuery()

    with patch("src.server.providers.database.get_providers_db", return_value=supabase):
        svc = ProviderService()
        result = await svc.list_models()
        assert result == []
        # Ensure a warning was logged
        assert any("Model list unavailable" in rec.message for rec in caplog.records)
