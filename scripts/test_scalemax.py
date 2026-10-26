"""
ScaleMax AI Diagnostic & Latency Instrumentation Tool
Tests connection, authentication, model compatibility, and latency against the ScaleMax API
without exposing raw credentials or issuing unnecessary large requests.
"""

import asyncio
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.config import settings
from backend.app.services.scalemax_client import (
    ScaleMaxAuthError,
    ScaleMaxModelError,
    ScaleMaxQuotaError,
    ScaleMaxRateLimitError,
    ScaleMaxTimeoutError,
    ScaleMaxProviderError,
    ScaleMaxError,
    scalemax_client,
)


def mask_key(k: str) -> str:
    if not k:
        return "[NOT SET]"
    if len(k) <= 8:
        return "****"
    return f"{k[:4]}...{k[-4:]}"


async def run_diagnostic(timeout: float = 30.0) -> int:
    print("=" * 60)
    print("   ShopSmart ScaleMax AI Integration Diagnostic")
    print("=" * 60)

    # 1. Environment & Configuration Check
    base_url = settings.scalemax_base_url
    api_key = settings.scalemax_api_key
    model = settings.scalemax_model

    print(f"Base URL    : {base_url}")
    print(f"Model Name  : {model or '[NOT SET]'}")
    print(f"API Key     : {mask_key(api_key)}")
    print(f"Connect T/O : {settings.scalemax_connect_timeout}s")
    print(f"Read T/O    : {settings.scalemax_read_timeout}s")
    print("-" * 60)

    if not scalemax_client.is_configured:
        missing = []
        if not api_key:
            missing.append("SCALEMAX_API_KEY")
        if not model:
            missing.append("SCALEMAX_MODEL")
        if not base_url:
            missing.append("SCALEMAX_BASE_URL")
        print(f"STATUS: UNCONFIGURED (Missing: {', '.join(missing)})")
        print("Note: In unconfigured state, ShopSmart operates in 100% High-Performance Factual Fallback Mode.")
        return 1

    # 2. Readiness Check
    ready_resp = await scalemax_client.check_ready()
    if not ready_resp or not ready_resp.ready:
        print(f"READINESS CHECK: FAILED ({ready_resp.reason if ready_resp else 'Unknown'})")
        return 1
    print("READINESS CHECK: PASSED (Configuration present and validated)")

    # 3. Live Inference & Latency Measurement
    print("\nSending diagnostic probe completion request to ScaleMax...")
    messages = [
        {
            "role": "system",
            "content": "You are an automated diagnostic endpoint. Respond ONLY with valid JSON.",
        },
        {
            "role": "user",
            "content": '{"action": "ping", "timestamp": ' + str(int(time.time())) + '}',
        },
    ]

    t_start = time.perf_counter()
    try:
        raw_json, timings = await scalemax_client.complete_json_with_timings(
            messages=messages,
            max_tokens=50,
            temperature=0.0,
            timeout=timeout,
            correlation_id="diag-probe",
        )
        total_time_ms = int((time.perf_counter() - t_start) * 1000)

        print("INFERENCE RESULT: SUCCESS")
        print(f"Response Content : {raw_json}")
        print("\nLatency Metrics (Monotonic Timing):")
        print(f"  • Model Completion Time : {timings.get('model_completion_ms', total_time_ms)} ms ({(timings.get('model_completion_ms', total_time_ms)/1000):.2f} s)")
        print(f"  • JSON Parse Time       : {timings.get('response_parsing_ms', 0)} ms")
        print(f"  • Total Round-Trip Time : {total_time_ms} ms ({(total_time_ms/1000):.2f} s)")
        print("=" * 60)
        print("DIAGNOSTIC PASSED: ScaleMax is ready for production shopping queries.")
        return 0

    except ScaleMaxAuthError as e:
        print("\nDIAGNOSTIC FAILED: Authentication Error")
        print(f"Detail: {e}")
        print("Remediation: Verify your SCALEMAX_API_KEY in backend/.env or your environment.")
        return 1
    except ScaleMaxRateLimitError as e:
        print("\nDIAGNOSTIC FAILED: Rate Limit Exceeded")
        print(f"Detail: {e}")
        print("Remediation: ScaleMax concurrency limit reached. Wait a few moments before retrying.")
        return 1
    except ScaleMaxQuotaError as e:
        print("\nDIAGNOSTIC FAILED: Quota Depleted")
        print(f"Detail: {e}")
        print("Remediation: ScaleMax token pack balance exhausted. Please top up your ScaleMax account.")
        return 1
    except ScaleMaxModelError as e:
        print("\nDIAGNOSTIC FAILED: Model Not Found")
        print(f"Detail: {e}")
        print(f"Remediation: Verify that '{model}' is accessible in your ScaleMax account catalog.")
        return 1
    except ScaleMaxTimeoutError as e:
        print("\nDIAGNOSTIC FAILED: Request Timeout")
        print(f"Detail: {e}")
        print("Remediation: ScaleMax did not respond within the deadline. Check network connectivity.")
        return 1
    except ScaleMaxProviderError as e:
        print("\nDIAGNOSTIC FAILED: Upstream Provider Error")
        print(f"Detail: {e}")
        print("Remediation: ScaleMax service is temporarily reporting an upstream error. Retry shortly.")
        return 1
    except Exception as e:
        print(f"\nDIAGNOSTIC FAILED: Unexpected Error ({type(e).__name__})")
        print(f"Detail: {e}")
        return 1


if __name__ == "__main__":
    code = asyncio.run(run_diagnostic())
    sys.exit(code)
