import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import openai

from backend.app.config import settings
from backend.app.services.scalemax_client import (
    ScaleMaxAuthError,
    ScaleMaxClient,
    ScaleMaxModelError,
    ScaleMaxQuotaError,
    ScaleMaxRateLimitError,
    ScaleMaxTimeoutError,
    extract_json_safely,
)


def test_scalemax_client_env_configuration(monkeypatch):
    monkeypatch.setenv("SCALEMAX_BASE_URL", "https://api.scalemax.pro/token/v1")
    monkeypatch.setenv("SCALEMAX_API_KEY", "test_key_scalemax_12345")
    monkeypatch.setenv("SCALEMAX_MODEL", "gpt-4o-mini")

    client = ScaleMaxClient(
        base_url=None,
        api_key=None,
        model=None,
    )
    # Re-read from settings
    settings.update_ai_config(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="test_key_scalemax_12345",
        model="gpt-4o-mini",
    )

    assert client.base_url == "https://api.scalemax.pro/token/v1"
    assert client.api_key == "test_key_scalemax_12345"
    assert client.model == "gpt-4o-mini"
    assert client.is_configured is True

    # Verify key masking in settings
    pub = settings.get_public_status()
    assert pub["ai_configured"] is True
    assert pub["api_key_set"] is True
    assert "test_key_scalemax_12345" not in pub["api_key_masked"]
    assert pub["api_key_masked"].startswith("test...")


def test_scalemax_client_unconfigured():
    client = ScaleMaxClient(base_url="", api_key="", model="")
    assert client.is_configured is False


@pytest.mark.asyncio
async def test_scalemax_check_ready_unconfigured():
    client = ScaleMaxClient(base_url="", api_key="", model="")
    ready = await client.check_ready()
    assert ready is not None
    assert ready.ready is False
    assert "unconfigured" in ready.reason.lower()


@pytest.mark.asyncio
async def test_scalemax_check_ready_configured():
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test",
        model="gpt-4o-mini",
    )
    ready = await client.check_ready()
    assert ready is not None
    assert ready.ready is True
    assert ready.model == "gpt-4o-mini"


def test_extract_json_safely():
    # Direct JSON
    assert extract_json_safely('{"key": "value"}') == {"key": "value"}

    # Markdown fence
    fence_json = 'Here is the plan:\n```json\n{"category": "laptop", "budget": 50000}\n```\nHope this helps!'
    assert extract_json_safely(fence_json) == {"category": "laptop", "budget": 50000}

    # Outermost braces with leading/trailing text
    noisy_json = 'Sure! { "status": "ok", "items": [1, 2] } Have a great day.'
    assert extract_json_safely(noisy_json) == {"status": "ok", "items": [1, 2]}

    # Empty string should raise ValueError
    with pytest.raises(ValueError):
        extract_json_safely("")

    # Non-JSON text should raise ValueError
    with pytest.raises(ValueError):
        extract_json_safely("No JSON here at all!")


@pytest.mark.asyncio
async def test_scalemax_chat_completion_mocked():
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test-key",
        model="gpt-4o-mini",
    )

    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Hello! I am ScaleMax AI."
    mock_resp.choices = [mock_choice]

    with patch.object(client, "_get_client") as mock_get_client:
        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(return_value=mock_resp)
        mock_get_client.return_value = mock_openai

        result = await client.complete_chat([{"role": "user", "content": "Hello"}])
        assert result == "Hello! I am ScaleMax AI."
        mock_openai.chat.completions.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_scalemax_error_classification_auth():
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-bad-key",
        model="gpt-4o-mini",
    )

    with patch.object(client, "_get_client") as mock_get_client:
        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(
            side_effect=openai.AuthenticationError(
                message="Incorrect API key provided",
                response=MagicMock(status_code=401),
                body=None,
            )
        )
        mock_get_client.return_value = mock_openai

        with pytest.raises(ScaleMaxAuthError) as exc_info:
            await client.complete_chat([{"role": "user", "content": "Hi"}])

        assert "authentication failed" in exc_info.value.message.lower()
        # Verify secret is never exposed in error message
        assert "sk-bad-key" not in exc_info.value.message


@pytest.mark.asyncio
async def test_scalemax_error_classification_rate_limit():
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test",
        model="gpt-4o-mini",
    )

    with patch.object(client, "_get_client") as mock_get_client:
        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(
            side_effect=openai.RateLimitError(
                message="Rate limit reached: requests per minute",
                response=MagicMock(status_code=429),
                body=None,
            )
        )
        mock_get_client.return_value = mock_openai

        with pytest.raises(ScaleMaxRateLimitError):
            await client.complete_chat([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_scalemax_error_classification_quota():
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test",
        model="gpt-4o-mini",
    )

    with patch.object(client, "_get_client") as mock_get_client:
        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(
            side_effect=openai.RateLimitError(
                message="You exceeded your current quota / balance",
                response=MagicMock(status_code=429),
                body=None,
            )
        )
        mock_get_client.return_value = mock_openai

        with pytest.raises(ScaleMaxQuotaError):
            await client.complete_chat([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_scalemax_error_classification_timeout():
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test",
        model="gpt-4o-mini",
    )

    with patch.object(client, "_get_client") as mock_get_client:
        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(
            side_effect=openai.APITimeoutError(request=MagicMock())
        )
        mock_get_client.return_value = mock_openai

        with pytest.raises(ScaleMaxTimeoutError):
            await client.complete_chat([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_scalemax_error_classification_model_not_found():
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test",
        model="non-existent-model",
    )

    with patch.object(client, "_get_client") as mock_get_client:
        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(
            side_effect=openai.NotFoundError(
                message="Model non-existent-model not found",
                response=MagicMock(status_code=404),
                body=None,
            )
        )
        mock_get_client.return_value = mock_openai

        with pytest.raises(ScaleMaxModelError):
            await client.complete_chat([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_scalemax_error_classification_upstream_provider_error():
    """Verify 500/502/503 errors and connection failures map to ScaleMaxProviderError."""
    from backend.app.services.scalemax_client import ScaleMaxProviderError
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test",
        model="gpt-4o-mini",
    )

    with patch.object(client, "_get_client") as mock_get_client:
        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(
            side_effect=openai.APIConnectionError(request=MagicMock())
        )
        mock_get_client.return_value = mock_openai

        with pytest.raises(ScaleMaxProviderError):
            await client.complete_chat([{"role": "user", "content": "Hi"}])


def test_scalemax_client_zero_automatic_retries():
    """Verify that AsyncOpenAI is initialized with max_retries=0 to prevent duplicate paid requests."""
    client = ScaleMaxClient(
        base_url="https://api.scalemax.pro/token/v1",
        api_key="sk-test",
        model="gpt-4o-mini",
    )
    sdk_client = client._get_client()
    assert sdk_client.max_retries == 0


@pytest.mark.asyncio
async def test_diagnostic_fails_gracefully_on_unconfigured():
    """Verify that the diagnostic script exits with code 1 if credentials are missing."""
    from backend.scripts.test_scalemax import run_diagnostic
    with patch("backend.scripts.test_scalemax.settings.scalemax_api_key", ""):
        exit_code = await run_diagnostic(timeout=2.0)
        assert exit_code == 1

