#!/usr/bin/env python3
"""
ShopSmart — Standalone ScaleMax AI Provider Diagnostic
Verifies the ScaleMax OpenAI-compatible API connection, authentication, model compatibility,
and latency independently of scrapers, databases, or frontend.

Usage:
  python backend/scripts/test_scalemax.py [--timeout 35] [--model MODEL_ID]
"""

import argparse
import asyncio
from pathlib import Path
import sys
import time

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.config import settings
from backend.app.services.scalemax_client import (
    ScaleMaxAuthError,
    ScaleMaxModelError,
    ScaleMaxProviderError,
    ScaleMaxQuotaError,
    ScaleMaxRateLimitError,
    ScaleMaxTimeoutError,
    scalemax_client,
)
from openai import AsyncOpenAI


def mask_key(key: str) -> str:
    """Mask key securely (never display secret)."""
    if not key:
        return "<UNCONFIGURED / EMPTY>"
    if len(key) <= 8:
        return "***"
    return f"{key[:4]}...{key[-4:]}"


async def test_model_catalog(client: AsyncOpenAI, configured_model: str) -> None:
    """Optional diagnostic to query authenticated models catalog."""
    print("\n[Diagnostic Step 1] Querying Authenticated Model Catalog...")
    try:
        catalog = await asyncio.wait_for(client.models.list(), timeout=12.0)
        model_ids = [m.id for m in catalog.data] if hasattr(catalog, "data") else []
        print(f"  -> Model catalog accessible. Total available models: {len(model_ids)}")
        if model_ids:
            sample_ids = model_ids[:5]
            print(f"  -> Sample catalog models: {', '.join(sample_ids)}")
            if configured_model in model_ids:
                print(f"  -> Configured model '{configured_model}' is confirmed in catalog.")
            else:
                print(f"  -> Note: Configured model '{configured_model}' was not explicitly listed in catalog.")
                print(f"     (Some token-pack models or proxies may not appear in /models list)")
    except Exception as e:
        print(f"  -> Model catalog check skipped/unavailable ({type(e).__name__}: {e})")
        print("     (Token-pack keys frequently restrict /models endpoint; proceeding to inference)")


async def test_minimal_chat(client: AsyncOpenAI, model: str, timeout: float) -> bool:
    """Execute minimal non-streaming chat completion."""
    print(f"\n[Diagnostic Step 2] Testing Minimal Chat Completion...")
    print(f"  -> Model Target : {model}")
    print(f"  -> Timeout Limit: {timeout:.1f}s")
    print(f"  -> Prompt       : 'Respond with exactly: OK'")
    print(f"  -> Max Tokens   : 16")

    messages = [
        {"role": "user", "content": "Respond with exactly: OK"}
    ]

    t0 = time.perf_counter()
    try:
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=16,
                temperature=0.1,
            ),
            timeout=timeout,
        )
        elapsed = time.perf_counter() - t0
        content = (response.choices[0].message.content or "").strip()
        print(f"\n[SUCCESS] ScaleMax Inference Completed!")
        print(f"  -> Elapsed Time : {elapsed:.2f}s")
        print(f"  -> Raw Response : {repr(content)}")
        if hasattr(response, "usage") and response.usage:
            prompt_tokens = getattr(response.usage, "prompt_tokens", "N/A")
            completion_tokens = getattr(response.usage, "completion_tokens", "N/A")
            total_tokens = getattr(response.usage, "total_tokens", "N/A")
            print(f"  -> Token Usage  : prompt={prompt_tokens}, completion={completion_tokens}, total={total_tokens}")
        return True

    except Exception as raw_e:
        elapsed = time.perf_counter() - t0
        print(f"\n[FAILURE] ScaleMax Inference Failed after {elapsed:.2f}s")
        classified = scalemax_client._classify_error(raw_e)
        print(f"  -> Classified Category: {classified.code.upper()}")
        print(f"  -> Safe Error Message : {classified.message}")
        print(f"  -> Exception Type     : {type(raw_e).__name__}")

        if isinstance(classified, ScaleMaxAuthError):
            print("\n  [Actionable Guidance: Authentication Failure (401)]")
            print("  - The configured SCALEMAX_API_KEY was rejected by ScaleMax.")
            print("  - Verify that the key is copied correctly from your dashboard at https://api.scalemax.pro.")
            print("  - Ensure you are using a token-pack key for https://api.scalemax.pro/token/v1.")
        elif isinstance(classified, ScaleMaxQuotaError):
            print("\n  [Actionable Guidance: Quota / Credit Exhausted (402/429)]")
            print("  - Your ScaleMax token allowance is depleted or expired.")
            print("  - Check your token pack balance at https://api.scalemax.pro.")
        elif isinstance(classified, ScaleMaxRateLimitError):
            print("\n  [Actionable Guidance: Rate Limit Exceeded (429)]")
            print("  - Too many concurrent requests or request rate limit reached.")
        elif isinstance(classified, ScaleMaxModelError):
            print("\n  [Actionable Guidance: Model Error (404/400)]")
            print(f"  - Model '{model}' is not recognized or not permitted by this token key.")
            print("  - Check available models in your ScaleMax token-pack subscription.")
        elif isinstance(classified, ScaleMaxTimeoutError):
            print("\n  [Actionable Guidance: Request Timeout]")
            print(f"  - ScaleMax did not respond within {timeout:.1f}s.")
            print("  - Try increasing --timeout or testing a lighter/faster model.")
        elif isinstance(classified, ScaleMaxProviderError):
            print("\n  [Actionable Guidance: Provider Error / Outage (502/503)]")
            print("  - ScaleMax upstream servers are temporarily unreachable or experiencing an outage.")
        else:
            print(f"\n  [Raw API Details]: {raw_e}")

        return False


async def run_diagnostic(timeout: float, model_override: str = None) -> int:
    print("=" * 60)
    print("      ShopSmart — ScaleMax AI Provider Diagnostic")
    print("=" * 60)

    base_url = settings.scalemax_base_url
    api_key = settings.scalemax_api_key
    model = model_override or settings.scalemax_model

    print(f"Base URL    : {base_url}")
    print(f"API Key     : {mask_key(api_key)}")
    print(f"Model ID    : {model or '<UNCONFIGURED>'}")

    if not base_url:
        print("\n[ERROR] SCALEMAX_BASE_URL is missing. Expected: https://api.scalemax.pro/token/v1")
        return 1

    if not api_key:
        print("\n[ERROR] SCALEMAX_API_KEY is not configured in backend/.env or environment.")
        return 1

    if not model:
        print("\n[ERROR] SCALEMAX_MODEL is not configured in backend/.env or environment.")
        return 1

    # Initialize AsyncOpenAI client
    client = AsyncOpenAI(
        base_url=base_url,
        api_key=api_key,
        timeout=timeout,
        max_retries=0,  # 0 retries for diagnostic to test raw direct connection
    )

    # 1. Model Catalog Check
    await test_model_catalog(client, model)

    # 2. Minimal Chat Completion Check
    success = await test_minimal_chat(client, model, timeout)
    return 0 if success else 2


def main():
    parser = argparse.ArgumentParser(description="ShopSmart ScaleMax Diagnostic")
    parser.add_argument("--timeout", type=float, default=35.0, help="Inference timeout in seconds (default: 35.0)")
    parser.add_argument("--model", type=str, default=None, help="Override model ID for testing")
    args = parser.parse_args()

    exit_code = asyncio.run(run_diagnostic(timeout=args.timeout, model_override=args.model))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
