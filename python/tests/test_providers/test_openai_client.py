import asyncio
import pytest

from src.server.providers.clients.openai_client import OpenAIClient
from src.server.providers.clients.base_client import ClientConfig


@pytest.mark.asyncio
async def test_headers_initialized():
    client = OpenAIClient(ClientConfig(api_key="KEY123"))
    assert client.config.base_url.endswith("/v1")
    assert client.config.headers["Authorization"] == "Bearer KEY123"
    assert client.config.headers["Content-Type"] == "application/json"


@pytest.mark.asyncio
async def test_chat_completion_shapes_response(monkeypatch):
    client = OpenAIClient(ClientConfig(api_key="k"))

    async def fake_request(method, url, **kwargs):
        return {
            "id": "cmpl-1",
            "model": "gpt-4",
            "usage": {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3},
            "choices": [
                {
                    "message": {"role": "assistant", "content": "Hello"},
                    "finish_reason": "stop",
                }
            ],
        }

    # Patch internal requester and session to bypass aiohttp
    monkeypatch.setattr(client, "_make_request", fake_request)
    async with client:
        res = await client.chat_completion(
            messages=[{"role": "user", "content": "Hi"}], model="gpt-4"
        )
    assert res["content"] == "Hello"
    assert res["role"] == "assistant"
    assert res["finish_reason"] == "stop"
    assert res["model"] == "gpt-4"
    assert res["id"] == "cmpl-1"


@pytest.mark.asyncio
async def test_chat_completion_stream_yields(monkeypatch):
    client = OpenAIClient(ClientConfig(api_key="k"))

    async def fake_stream(url, payload):
        yield {"content": "Hel", "finish_reason": None}
        yield {"content": "lo", "finish_reason": "stop"}

    monkeypatch.setattr(client, "_stream_chat_completion", fake_stream)
    async with client:
        chunks = [c async for c in client.chat_completion_stream(
            messages=[{"role": "user", "content": "Hi"}], model="gpt-4"
        )]
    assert "".join(c["content"] for c in chunks) == "Hello"
    assert chunks[-1]["finish_reason"] == "stop"


@pytest.mark.asyncio
async def test_generate_embeddings_calls_and_collects(monkeypatch):
    client = OpenAIClient(ClientConfig(api_key="k"))

    async def fake_request(method, url, **kwargs):
        # echo back number of inputs
        inputs = kwargs["json"]["input"]
        return {"data": [{"embedding": [float(i), float(i)+0.5]} for i, _ in enumerate(inputs)]}

    monkeypatch.setattr(client, "_make_request", fake_request)
    async with client:
        embs = await client.generate_embeddings(["a", "b"], model="text-embedding-3-small")
    assert embs == [[0.0, 0.5], [1.0, 1.5]]


@pytest.mark.asyncio
async def test_health_check_true_and_false(monkeypatch):
    client = OpenAIClient(ClientConfig(api_key="k"))

    async def ok_request(method, url, **kwargs):
        return {"data": [1]}

    async def bad_request(method, url, **kwargs):
        raise Exception("boom")

    monkeypatch.setattr(client, "_make_request", ok_request)
    async with client:
        assert await client.health_check() is True

    monkeypatch.setattr(client, "_make_request", bad_request)
    async with client:
        assert await client.health_check() is False
