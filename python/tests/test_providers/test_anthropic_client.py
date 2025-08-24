import pytest

from src.server.providers.clients.anthropic_client import AnthropicClient
from src.server.providers.clients.base_client import ClientConfig


@pytest.mark.asyncio
async def test_headers_initialized():
    client = AnthropicClient(ClientConfig(api_key="KEY123"))
    assert client.config.base_url == "https://api.anthropic.com"
    h = client.config.headers
    assert h["x-api-key"] == "KEY123"
    assert h["anthropic-version"] == "2023-06-01"
    assert h["Content-Type"] == "application/json"


@pytest.mark.asyncio
async def test_message_conversion_and_response_shape(monkeypatch):
    client = AnthropicClient(ClientConfig(api_key="k"))

    # validate conversion: system message is lifted to payload["system"] and removed from list
    async def fake_request(method, url, **kwargs):
        payload = kwargs["json"]
        assert payload["model"] == "claude-3-haiku-20240307"
        assert payload["system"] == "sys"
        for m in payload["messages"]:
            assert m["role"] in {"user", "assistant"}
            assert m["role"] != "system"
        return {
            "id": "msg-1",
            "model": "claude-3-haiku-20240307",
            "stop_reason": "stop_sequence",
            "usage": {"input_tokens": 5, "output_tokens": 7},
            "content": [{"text": "Hi there"}],
        }

    monkeypatch.setattr(client, "_make_request", fake_request)
    async with client:
        res = await client.chat_completion(
            messages=[
                {"role": "system", "content": "sys"},
                {"role": "user", "content": "Hello"},
            ],
            model="claude-3-haiku-20240307",
        )
    assert res["content"] == "Hi there"
    assert res["role"] == "assistant"
    assert res["finish_reason"] == "stop_sequence"
    assert res["usage"]["prompt_tokens"] == 5
    assert res["usage"]["completion_tokens"] == 7
    assert res["usage"]["total_tokens"] == 12


@pytest.mark.asyncio
async def test_generate_embeddings_not_implemented():
    client = AnthropicClient(ClientConfig(api_key="k"))
    async with client:
        with pytest.raises(NotImplementedError):
            await client.generate_embeddings(["a"], model="x")


@pytest.mark.asyncio
async def test_health_check_true_and_false(monkeypatch):
    client = AnthropicClient(ClientConfig(api_key="k"))

    async def ok_request(method, url, **kwargs):
        return {"ok": True}

    async def bad_request(method, url, **kwargs):
        raise Exception("nope")

    monkeypatch.setattr(client, "_make_request", ok_request)
    async with client:
        assert await client.health_check() is True

    monkeypatch.setattr(client, "_make_request", bad_request)
    async with client:
        assert await client.health_check() is False
