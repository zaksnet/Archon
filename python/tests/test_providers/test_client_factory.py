import pytest

from src.server.providers.clients.client_factory import ProviderClientFactory
from src.server.providers.core.enums import ProviderType
from src.server.providers.clients.base_client import BaseProviderClient, ClientConfig


class DummyClient(BaseProviderClient):
    async def chat_completion(self, messages, model, temperature=0.7, max_tokens=None, **kwargs):
        return {"ok": True}

    async def chat_completion_stream(self, messages, model, temperature=0.7, max_tokens=None, **kwargs):
        if False:
            yield {}

    async def generate_embeddings(self, texts, model, **kwargs):
        return [[0.0]]

    async def health_check(self) -> bool:
        return True


def test_create_supported_clients():
    for ptype in (ProviderType.OPENAI, ProviderType.ANTHROPIC):
        client = ProviderClientFactory.create_client(
            provider_type=ptype,
            api_key="k",
            base_url="http://example",
        )
        assert isinstance(client, BaseProviderClient)


def test_unsupported_provider_raises():
    with pytest.raises(ValueError):
        ProviderClientFactory.create_client(
            provider_type=ProviderType.CUSTOM,
            api_key="k",
        )


def test_register_client_and_create():
    ProviderClientFactory.register_client(ProviderType.CUSTOM, DummyClient)
    client = ProviderClientFactory.create_client(ProviderType.CUSTOM, api_key="k")
    assert isinstance(client, DummyClient)
