import asyncio
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

import openai
from openai import AsyncOpenAI

from backend.app.config import settings
from backend.app.models.schemas import HealthResponse, ReadyResponse

logger = logging.getLogger("shopsmart.scalemax_client")


class ScaleMaxError(Exception):
    """Base exception for ScaleMax AI client errors."""
    def __init__(self, message: str, code: str = "scalemax_error", status_code: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class ScaleMaxAuthError(ScaleMaxError):
    """Authentication or authorization failure."""
    def __init__(self, message: str = "ScaleMax authentication failed: invalid or missing API key."):
        super().__init__(message, code="auth_error", status_code=401)


class ScaleMaxRateLimitError(ScaleMaxError):
    """Rate limit or concurrency throttle reached."""
    def __init__(self, message: str = "ScaleMax rate limit exceeded. Please try again shortly."):
        super().__init__(message, code="rate_limited", status_code=429)


class ScaleMaxQuotaError(ScaleMaxError):
    """Account quota or token balance exhausted."""
    def __init__(self, message: str = "ScaleMax token balance or quota exhausted."):
        super().__init__(message, code="quota_exhausted", status_code=402)


class ScaleMaxModelError(ScaleMaxError):
    """Model ID not found, unsupported, or access denied."""
    def __init__(self, model_name: str, message: Optional[str] = None):
        msg = message or f"ScaleMax model '{model_name}' is not found or unsupported on this account."
        super().__init__(msg, code="model_error", status_code=404)


class ScaleMaxTimeoutError(ScaleMaxError):
    """Inference or connection request timed out."""
    def __init__(self, message: str = "ScaleMax inference request timed out."):
        super().__init__(message, code="timeout", status_code=504)


class ScaleMaxProviderError(ScaleMaxError):
    """Upstream ScaleMax provider internal error or outage."""
    def __init__(self, message: str = "ScaleMax provider temporarily unavailable."):
        super().__init__(message, code="provider_error", status_code=502)


def extract_json_safely(text: str) -> Any:
    """
    Safely extract and parse JSON from model responses, handling potential markdown fences,
    introductory text, or trailing commentary.
    """
    if not text or not text.strip():
        raise ValueError("Model returned empty response.")

    cleaned = text.strip()

    # 1. Try direct JSON parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 2. Extract from ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        block_text = match.group(1).strip()
        try:
            return json.loads(block_text)
        except json.JSONDecodeError:
            pass

    # 3. Extract outermost { ... }
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = cleaned[first_brace : last_brace + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    # 4. Extract outermost [ ... ]
    first_bracket = cleaned.find("[")
    last_bracket = cleaned.rfind("]")
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        candidate = cleaned[first_bracket : last_bracket + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Unable to extract valid JSON from model response: {cleaned[:180]}...")


class ScaleMaxClient:
    """
    Production-grade ScaleMax AI client using the OpenAI-compatible SDK protocol.
    Sole AI provider for ShopSmart: natural language query interpretation,
    grounded product ranking, comparison explanations, and shopping assistant chat.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        default_timeout: Optional[float] = None,
    ):
        self._custom_base_url = base_url
        self._custom_api_key = api_key
        self._custom_model = model
        self._default_timeout = default_timeout
        self._cached_client: Optional[AsyncOpenAI] = None
        self._cached_client_key: Optional[tuple] = None

    @property
    def default_timeout(self) -> float:
        return self._default_timeout if self._default_timeout is not None else settings.scalemax_read_timeout

    @property
    def base_url(self) -> str:
        url = self._custom_base_url if self._custom_base_url is not None else settings.scalemax_base_url
        return (url or "https://api.scalemax.pro/token/v1").rstrip("/")

    @property
    def api_key(self) -> str:
        return self._custom_api_key if self._custom_api_key is not None else settings.scalemax_api_key

    @property
    def model(self) -> str:
        return self._custom_model if self._custom_model is not None else settings.scalemax_model

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key and self.model)

    def _get_client(self) -> AsyncOpenAI:
        """Returns a reused AsyncOpenAI client configured for ScaleMax with 0 automatic retries."""
        key = (self.base_url, self.api_key)
        if self._cached_client is None or self._cached_client_key != key:
            # Use granular timeouts: connect timeout + read timeout
            import httpx
            http_timeout = httpx.Timeout(
                timeout=self.default_timeout,
                connect=settings.scalemax_connect_timeout,
                read=self.default_timeout,
                write=10.0,
            )
            self._cached_client = AsyncOpenAI(
                base_url=self.base_url,
                api_key=self.api_key or "unconfigured",
                timeout=http_timeout,
                max_retries=0,  # Zero blind retries to prevent duplicate paid requests
            )
            self._cached_client_key = key
        return self._cached_client

    def _classify_error(self, err: Exception) -> ScaleMaxError:
        """Categorize OpenAI SDK / network exceptions into typed, safe ScaleMax errors."""
        if isinstance(err, openai.AuthenticationError):
            return ScaleMaxAuthError()
        elif isinstance(err, openai.RateLimitError):
            err_msg = str(err).lower()
            if "quota" in err_msg or "balance" in err_msg or "credit" in err_msg:
                return ScaleMaxQuotaError()
            return ScaleMaxRateLimitError()
        elif isinstance(err, openai.NotFoundError):
            return ScaleMaxModelError(self.model, f"ScaleMax model '{self.model}' was not found.")
        elif isinstance(err, openai.BadRequestError):
            err_str = str(err)
            if "model" in err_str.lower():
                return ScaleMaxModelError(self.model, f"Unsupported model '{self.model}': {err_str}")
            return ScaleMaxError(f"ScaleMax bad request: {err_str}", code="bad_request", status_code=400)
        elif isinstance(err, (openai.APITimeoutError, asyncio.TimeoutError)):
            return ScaleMaxTimeoutError()
        elif isinstance(err, (openai.APIConnectionError, openai.InternalServerError)):
            return ScaleMaxProviderError(f"ScaleMax provider unavailable: {type(err).__name__}")
        elif isinstance(err, openai.APIError):
            return ScaleMaxError(f"ScaleMax API error: {err.message}", code="api_error", status_code=err.status_code)
        elif isinstance(err, ScaleMaxError):
            return err
        return ScaleMaxError(f"Unexpected AI error: {type(err).__name__}: {str(err)}")

    async def check_health(self) -> Optional[HealthResponse]:
        """Diagnostic health status of the ScaleMax integration."""
        return HealthResponse(
            status="ok",
            service="scalemax-ai",
            version="1.0.0",
            schema_version="1.0",
            model={"configured_model": self.model or "none", "provider": "scalemax"},
            device={"type": "cloud-api", "provider": "ScaleMax"},
            capabilities=["chat", "json", "ranking", "comparison", "interpretation"],
            uptime_s=int(time.time()),
        )

    async def check_ready(self) -> Optional[ReadyResponse]:
        """
        Validate whether ScaleMax is configured and operational.
        Checks environment variables without making an unnecessary billable inference call.
        """
        if not self.is_configured:
            reasons = []
            if not self.api_key:
                reasons.append("SCALEMAX_API_KEY is not set")
            if not self.model:
                reasons.append("SCALEMAX_MODEL is not set")
            if not self.base_url:
                reasons.append("SCALEMAX_BASE_URL is not set")
            return ReadyResponse(
                ready=False,
                reason="ScaleMax AI unconfigured: " + ", ".join(reasons),
                model=self.model or None,
                device_type="cloud-api",
            )

        return ReadyResponse(
            ready=True,
            reason=None,
            model=self.model,
            device_type="cloud-api",
        )

    async def complete_chat_with_timings(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1000,
        temperature: float = 0.2,
        timeout: Optional[float] = None,
        correlation_id: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Execute a text chat completion against ScaleMax with monotonic latency instrumentation.
        Returns (content, timings_dict).
        """
        if not self.is_configured:
            raise ScaleMaxError("ScaleMax AI client is not configured.", code="not_configured")

        req_id = correlation_id or f"sm-{uuid.uuid4().hex[:8]}"
        client = self._get_client()
        call_timeout = timeout or self.default_timeout

        t_start = time.perf_counter()
        try:
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=self.model,
                    messages=messages,  # type: ignore[arg-type]
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout=call_timeout,
                ),
                timeout=call_timeout + 1.0,
            )
            t_completion = time.perf_counter()
            completion_ms = int((t_completion - t_start) * 1000)

            choice = response.choices[0]
            content = (choice.message.content or "").strip()
            if not content:
                # Check if reasoning_content was generated instead
                reasoning = getattr(choice.message, "reasoning_content", None) or ""
                if "{" in reasoning and "}" in reasoning:
                    content = reasoning.strip()
                else:
                    raise ValueError(f"ScaleMax model returned empty output (finish_reason: {choice.finish_reason})")

            timings = {
                "correlation_id": req_id,
                "model_completion_ms": completion_ms,
                "total_ai_latency_ms": completion_ms,
            }
            return content, timings
        except Exception as e:
            classified = self._classify_error(e)
            logger.warning(f"ScaleMax completion failed [{req_id}]: {classified.code}: {classified.message}")
            raise classified

    async def complete_chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1000,
        temperature: float = 0.2,
        timeout: Optional[float] = None,
    ) -> str:
        """Execute a text chat completion against ScaleMax."""
        content, _ = await self.complete_chat_with_timings(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout,
        )
        return content

    async def complete_json_with_timings(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1200,
        temperature: float = 0.1,
        timeout: Optional[float] = None,
        correlation_id: Optional[str] = None,
    ) -> Tuple[Any, Dict[str, Any]]:
        """
        Execute completion against ScaleMax and parse response as JSON with latency breakdown.
        Returns (parsed_json, timings_dict).
        """
        content, timings = await self.complete_chat_with_timings(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout,
            correlation_id=correlation_id,
        )
        t_parse_start = time.perf_counter()
        parsed = extract_json_safely(content)
        t_parse_end = time.perf_counter()
        parse_ms = int((t_parse_end - t_parse_start) * 1000)

        timings["response_parsing_ms"] = parse_ms
        timings["total_ai_latency_ms"] = timings["model_completion_ms"] + parse_ms
        return parsed, timings

    async def complete_json(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1200,
        temperature: float = 0.1,
        timeout: Optional[float] = None,
    ) -> Any:
        """
        Execute a completion against ScaleMax and parse the response as JSON.
        Uses a robust bounded parser that handles code fences or surrounding text safely.
        """
        parsed, _ = await self.complete_json_with_timings(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout,
        )
        return parsed


scalemax_client = ScaleMaxClient()

