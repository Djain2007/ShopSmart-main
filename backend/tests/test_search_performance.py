import asyncio
from pathlib import Path
import time
import pytest
from unittest.mock import AsyncMock, PropertyMock, patch

from backend.app.services.scalemax_client import ScaleMaxClient
from backend.app.services.search_service import search_service
from backend.app.services.search_cache import search_cache

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(autouse=True)
def clear_cache_before_each_test():
    search_cache.clear()
    yield
    search_cache.clear()


@pytest.mark.asyncio
async def test_parallel_retailer_searches_with_timings():
    """Verify Amazon and Flipkart run concurrently and individual monotonic timings are captured."""
    mock_amz = {
        "source": "amazon.in",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {
                "id": "A1",
                "title": "HP Pavilion 15 Laptop",
                "price": "55,000",
                "rating": 4.3,
                "review_count": 300,
                "url": "https://www.amazon.in/dp/A1",
                "source": "amazon.in",
                "bullets": ["16GB RAM", "512GB SSD"],
            }
        ],
    }

    mock_fk = {
        "source": "flipkart.com",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {
                "id": "F1",
                "title": "Lenovo IdeaPad 3 Laptop",
                "price": "52,000",
                "rating": 4.1,
                "review_count": 180,
                "url": "https://www.flipkart.com/p/item?pid=F1",
                "source": "flipkart.com",
                "bullets": ["16GB RAM", "512GB SSD"],
            }
        ],
    }

    async def slow_amz(*args, **kwargs):
        await asyncio.sleep(0.05)
        return mock_amz

    async def slow_fk(*args, **kwargs):
        await asyncio.sleep(0.05)
        return mock_fk

    with patch.object(search_service.scrapers["amazon.in"], "search", side_effect=slow_amz), \
         patch.object(search_service.scrapers["flipkart.com"], "search", side_effect=slow_fk), \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):

        t0 = time.perf_counter()
        resp = await search_service.execute_search(query="laptop 16gb ram", max_results_per_source=5)
        total_time = time.perf_counter() - t0

        # Since they ran in parallel (0.05s each), total time should be << sequential time + I/O
        assert total_time < 0.35
        assert len(resp.products) == 2
        assert resp.retailer_status["amazon.in"] == "success"
        assert resp.retailer_status["flipkart.com"] == "success"
        assert resp.timings is not None
        assert "retailer_timings" in resp.timings
        assert "amazon.in" in resp.timings["retailer_timings"]
        assert "flipkart.com" in resp.timings["retailer_timings"]


@pytest.mark.asyncio
async def test_independent_retailer_failure_returns_partial_results():
    """Verify that if Flipkart fails or times out, Amazon results are still returned cleanly."""
    mock_amz = {
        "source": "amazon.in",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {
                "id": "A1",
                "title": "Apple iPhone 15 128GB",
                "price": "71,000",
                "rating": 4.6,
                "review_count": 1200,
                "url": "https://www.amazon.in/dp/A1",
                "source": "amazon.in",
                "bullets": ["A16 Bionic", "48MP Camera"],
            }
        ],
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, side_effect=RuntimeError("Flipkart network drop")), \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):

        resp = await search_service.execute_search(query="iphone 15", max_results_per_source=5)

        assert len(resp.products) == 1
        assert resp.products[0].source == "amazon.in"
        assert resp.retailer_status["amazon.in"] == "success"
        assert "error" in resp.retailer_status["flipkart.com"]
        assert any("flipkart.com was temporarily unreachable" in w for w in resp.warnings)


@pytest.mark.asyncio
async def test_search_deadline_cancels_slow_retailer():
    """Verify that a slow retailer exceeding search deadline is cancelled and does not block the search."""
    mock_amz = {
        "source": "amazon.in",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {
                "id": "A1",
                "title": "Sony WH-1000XM5 Headphones",
                "price": "29,990",
                "rating": 4.5,
                "review_count": 800,
                "url": "https://www.amazon.in/dp/A1",
                "source": "amazon.in",
                "bullets": ["Active Noise Cancelling", "30hr battery"],
            }
        ],
    }

    async def hanging_fk(*args, **kwargs):
        # Simulates a slow scraper that hangs for 20 seconds
        await asyncio.sleep(20)
        return {"source": "flipkart.com", "status": "success", "products": []}

    orig_deadline = search_service.retailer_deadline_seconds
    search_service.retailer_deadline_seconds = 0.2  # Set low deadline for test

    try:
        with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz), \
             patch.object(search_service.scrapers["flipkart.com"], "search", side_effect=hanging_fk), \
             patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):

            t0 = time.perf_counter()
            resp = await search_service.execute_search(query="sony headphones", max_results_per_source=5)
            duration = time.perf_counter() - t0

            # Finished well before 20s (around 0.2s - 0.5s)
            assert duration < 1.0
            assert len(resp.products) == 1
            assert resp.retailer_status["amazon.in"] == "success"
            assert resp.retailer_status["flipkart.com"] == "timeout"
    finally:
        search_service.retailer_deadline_seconds = orig_deadline


@pytest.mark.asyncio
async def test_cache_hit_and_expiration():
    """Verify search caching accelerates repeated searches and respects TTL."""
    mock_amz = {
        "source": "amazon.in",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {
                "id": "A1",
                "title": "Boat Airdopes 141",
                "price": "1,299",
                "rating": 4.0,
                "review_count": 5000,
                "url": "https://www.amazon.in/dp/A1",
                "source": "amazon.in",
                "bullets": ["42H playtime", "Fast charge"],
            }
        ],
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value={"source": "flipkart.com", "status": "empty", "products": []}), \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):

        # First call: cache miss
        resp1 = await search_service.execute_search(query="boat earbuds", max_results_per_source=5)
        assert resp1.timings["cache_hit"] is False
        assert len(resp1.products) == 1

        # Second call: cache hit!
        resp2 = await search_service.execute_search(query="boat earbuds", max_results_per_source=5)
        assert resp2.timings["cache_hit"] is True
        assert resp2.timings["total_duration_ms"] < 20  # Instant in-memory retrieval!
        assert len(resp2.products) == 1
        assert resp2.products[0].id == resp1.products[0].id


@pytest.mark.asyncio
async def test_ai_ranking_failure_falls_back_gracefully():
    """Verify that if ScaleMax ranking fails, deterministic ranking provides valid results instantly."""
    mock_amz = {
        "source": "amazon.in",
        "status": "success",
        "message": "Found 2 products",
        "products": [
            {
                "id": "A1",
                "title": "Dell Inspiron 15",
                "price": "45,000",
                "rating": 4.1,
                "url": "https://www.amazon.in/dp/A1",
                "source": "amazon.in",
            },
            {
                "id": "A2",
                "title": "Asus Vivobook 15",
                "price": "42,000",
                "rating": 4.3,
                "url": "https://www.amazon.in/dp/A2",
                "source": "amazon.in",
            },
        ],
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value={"source": "flipkart.com", "status": "empty", "products": []}), \
         patch.object(search_service, "ai_ranking_deadline_seconds", 0.1), \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, side_effect=TimeoutError("ScaleMax timed out")):

        resp = await search_service.execute_search(query="office laptop", max_results_per_source=5)

        assert len(resp.products) == 2
        # Deterministic scoring assigned ranks and scores
        assert resp.products[0].rank == 1
        assert resp.products[0].score > 0
        assert resp.products[0].explanation.source == "deterministic"
        assert resp.ai_status == "degraded"
        assert any("fallback" in w.lower() or "deadline" in w.lower() or "budget" in w.lower() for w in resp.warnings)


@pytest.mark.asyncio
async def test_amazon_503_anti_bot_keeps_flipkart_results():
    """Verify that when Amazon returns HTTP 503 bot challenge, Flipkart products are preserved and partial result surfaced."""
    mock_amz_blocked = {
        "source": "amazon.in",
        "status": "blocked",
        "message": "amazon.in requires a browser verification challenge at this time.",
        "products": [],
    }
    mock_fk_success = {
        "source": "flipkart.com",
        "status": "success",
        "message": "Found 2 products",
        "products": [
            {
                "id": "FK1",
                "title": "Realme Buds T300 TWS Earbuds",
                "price": "2,299",
                "rating": 4.4,
                "review_count": 8000,
                "url": "https://www.flipkart.com/p/item?pid=FK1",
                "source": "flipkart.com",
                "bullets": ["30dB ANC", "Spatial Audio"],
            }
        ],
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz_blocked), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value=mock_fk_success), \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):

        resp = await search_service.execute_search(query="wireless earbuds", max_results_per_source=5)

        assert len(resp.products) == 1
        assert resp.products[0].source == "flipkart.com"
        assert resp.retailer_status["amazon.in"] == "blocked"
        assert resp.retailer_status["flipkart.com"] == "success"
        assert any("verification challenge" in w.lower() for w in resp.warnings)


@pytest.mark.asyncio
async def test_concurrent_duplicate_searches_coalesce_single_execution():
    """Verify that concurrent duplicate searches coalesce to a single scraper execution."""
    mock_amz = {
        "source": "amazon.in",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {
                "id": "A1",
                "title": "Logitech MX Master 3S Mouse",
                "price": "8,995",
                "rating": 4.7,
                "review_count": 1500,
                "url": "https://www.amazon.in/dp/A1",
                "source": "amazon.in",
            }
        ],
    }

    call_count = {"amz": 0}

    async def counted_amz(*args, **kwargs):
        call_count["amz"] += 1
        await asyncio.sleep(0.08)
        return mock_amz

    with patch.object(search_service.scrapers["amazon.in"], "search", side_effect=counted_amz), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value={"source": "flipkart.com", "status": "empty", "products": []}), \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):

        # Launch two searches simultaneously for the same query
        task1 = search_service.execute_search(query="mx master 3s", max_results_per_source=5, use_cache=False)
        task2 = search_service.execute_search(query="mx master 3s", max_results_per_source=5, use_cache=False)

        resp1, resp2 = await asyncio.gather(task1, task2)

        # Scraper should have been invoked exactly ONCE thanks to coalescing
        assert call_count["amz"] == 1
        assert len(resp1.products) == 1
        assert len(resp2.products) == 1
        assert resp1.products[0].id == resp2.products[0].id


@pytest.mark.asyncio
async def test_regression_search_a_wireless_earbuds_pipeline():
    """
    Search A Regression:
    Query: 'wireless earbuds'
    Amazon: 503 blocked
    Flipkart: 200, returns earbuds
    ScaleMax: unconfigured / unavailable
    Asserts Flipkart products preserved, partial results notice, ai_status=unavailable.
    """
    mock_amz_503 = {
        "source": "amazon.in",
        "status": "blocked",
        "message": "amazon.in requires a browser verification challenge at this time.",
        "products": [],
    }

    html_path = FIXTURES_DIR / "flipkart_earbuds_search.html"
    from backend.app.scrapers.flipkart import FlipkartScraper
    raw_fk_earbuds = FlipkartScraper().parse_search_page(html_path.read_text(encoding="utf-8"))
    mock_fk_200 = {
        "source": "flipkart.com",
        "status": "success",
        "message": f"Found {len(raw_fk_earbuds)} products",
        "products": raw_fk_earbuds,
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz_503), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value=mock_fk_200), \
         patch.object(ScaleMaxClient, "is_configured", new_callable=PropertyMock, return_value=False):

        resp = await search_service.execute_search(query="wireless earbuds", max_results_per_source=5, use_cache=False)

        assert len(resp.products) == 4
        assert resp.ai_status == "unavailable"
        assert resp.retailer_status["amazon.in"] == "blocked"
        assert resp.retailer_status["flipkart.com"] == "success"
        assert resp.counts.returned == 4
        assert all(p.source == "flipkart.com" for p in resp.products)
        assert any("challenge" in w.lower() for w in resp.warnings)
        assert resp.timings is not None
        assert "retailer_search_ms" in resp.timings
        assert "total_duration_ms" in resp.timings


@pytest.mark.asyncio
async def test_regression_search_b_running_shoes_pipeline():
    """
    Search B Regression:
    Query: 'Running Shoes under 1500 black colour'
    Amazon: 503 blocked
    Flipkart: 200, returns 4 running shoes in black under 1500
    ScaleMax: 200, ranks top 3
    Asserts all 4 shoes preserved, top 3 AI-ranked with grounded explanations, 4th deterministically scored, ai_status=ready.
    """
    mock_amz_503 = {
        "source": "amazon.in",
        "status": "blocked",
        "message": "amazon.in requires a browser verification challenge at this time.",
        "products": [],
    }

    html_path = FIXTURES_DIR / "flipkart_running_shoes_search.html"
    from backend.app.scrapers.flipkart import FlipkartScraper
    raw_fk_shoes = FlipkartScraper().parse_search_page(html_path.read_text(encoding="utf-8"))
    mock_fk_200 = {
        "source": "flipkart.com",
        "status": "success",
        "message": f"Found {len(raw_fk_shoes)} products",
        "products": raw_fk_shoes,
    }

    # Mock ScaleMax completion response
    mock_scalemax_ranked_json = {
        "overall_summary": "Top verified black running shoes under ₹1500 with strong ratings and lightweight cushioning.",
        "ranked": [
            {
                "product_id": "SHOK7KXYZ555",
                "score": 92.0,
                "confidence": "high",
                "summary": "Best overall running shoe under budget with verified 4.2 rating",
                "pros": ["Priced at ₹1,199 well under budget", "4.2★ rating from 4,500+ runners"],
                "cons": ["Standard mesh upper"]
            },
            {
                "product_id": "SHOM9MXYZ777",
                "score": 89.0,
                "confidence": "high",
                "summary": "Durable daily running shoe from Sparx under ₹1100",
                "pros": ["High 4.3★ rating", "Good grip sole"],
                "cons": ["Slightly heavier build"]
            },
            {
                "product_id": "SHOL8LXYZ666",
                "score": 85.0,
                "confidence": "medium",
                "summary": "Lowest cost option at ₹899 with solid performance",
                "pros": ["Under ₹900 budget-friendly option"],
                "cons": ["Basic insole cushioning"]
            }
        ]
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz_503), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value=mock_fk_200), \
         patch.object(ScaleMaxClient, "is_configured", new_callable=PropertyMock, return_value=True), \
         patch("backend.app.services.search_service.ai_service.client.complete_json_with_timings", new_callable=AsyncMock, return_value=(mock_scalemax_ranked_json, {"model_completion_ms": 120, "response_parsing_ms": 1})):

        resp = await search_service.execute_search(
            query="Running Shoes under 1500 black colour",
            max_results_per_source=5,
            use_cache=False,
        )

        assert len(resp.products) == 4
        assert resp.ai_status == "ready"
        assert resp.retailer_status["amazon.in"] == "blocked"
        assert resp.retailer_status["flipkart.com"] == "success"

        # Check that top 3 products have AI ranking and explanations
        p1 = resp.products[0]
        assert "SHOK7KXYZ555" in p1.id
        assert p1.score == 92.0
        assert p1.explanation.source == "llm"
        assert "4.2★ rating" in p1.explanation.pros[1]

        # 4th product (Red Tape) was not in top-3 candidates sent to LLM, so it gets deterministic scoring and is preserved
        p4 = next(p for p in resp.products if "SHON0NXYZ888" in p.id)
        assert p4 is not None
        assert p4.explanation.source == "deterministic"
        assert p4.price == 1349.0

        # Detailed timings attached
        assert resp.timings is not None
        assert "scalemax_detailed_timings" in resp.timings
        assert resp.timings["scalemax_detailed_timings"]["model_completion_ms"] == 120


@pytest.mark.asyncio
async def test_both_retailers_unavailable_returns_no_fake_products():
    """Verify that when all retailers fail, 0 products are returned, warnings are truthful, and never invents fake products."""
    mock_amz_blocked = {
        "source": "amazon.in",
        "status": "blocked",
        "message": "amazon.in requires a browser verification challenge.",
        "products": [],
    }
    mock_fk_down = {
        "source": "flipkart.com",
        "status": "unavailable",
        "message": "flipkart.com connection refused.",
        "products": [],
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value=mock_amz_blocked), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value=mock_fk_down):

        resp = await search_service.execute_search(query="dslr camera 4k", max_results_per_source=5, use_cache=False)

        assert len(resp.products) == 0
        assert resp.counts.returned == 0
        assert any("challenge" in w.lower() or "unreachable" in w.lower() for w in resp.warnings)


@pytest.mark.asyncio
async def test_invalid_ranking_json_preserves_all_products():
    """Verify that if ScaleMax returns malformed output, deterministic scoring preserves all valid products."""
    mock_fk = {
        "source": "flipkart.com",
        "status": "success",
        "message": "Found 2 products",
        "products": [
            {"id": "P1", "title": "Keyboard A", "price": "1,500", "source": "flipkart.com", "url": "https://www.flipkart.com/keyboard-a/p/itm123?pid=P1"},
            {"id": "P2", "title": "Keyboard B", "price": "2,000", "source": "flipkart.com", "url": "https://www.flipkart.com/keyboard-b/p/itm456?pid=P2"},
        ],
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value={"source": "amazon.in", "status": "no_results", "products": []}), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value=mock_fk), \
         patch.object(ScaleMaxClient, "is_configured", new_callable=PropertyMock, return_value=True), \
         patch("backend.app.services.search_service.ai_service.client.complete_json_with_timings", new_callable=AsyncMock, side_effect=ValueError("Corrupted JSON output")):

        resp = await search_service.execute_search(query="mechanical keyboard", max_results_per_source=5, use_cache=False)

        # Both products survive!
        assert len(resp.products) == 2
        assert resp.ai_status == "degraded"
        assert all(p.explanation.source == "deterministic" for p in resp.products)


@pytest.mark.asyncio
async def test_ranking_referencing_hallucinated_ids_filtered():
    """Verify that if ScaleMax hallucinates non-existent IDs, only genuine candidate IDs are kept."""
    mock_fk = {
        "source": "flipkart.com",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {"id": "REAL_ID_100", "title": "Genuine Smartwatch", "price": "2,499", "source": "flipkart.com", "url": "https://www.flipkart.com/smartwatch/p/itm100?pid=REAL_ID_100"},
        ],
    }

    mock_scalemax_hallucination = {
        "overall_summary": "Top smartwatches",
        "ranked": [
            {"product_id": "FAKE_HALLUCINATED_999", "score": 99.0, "summary": "Invented product"},
            {"product_id": "REAL_ID_100", "score": 88.0, "summary": "Real verified product"},
        ]
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock, return_value={"source": "amazon.in", "status": "no_results", "products": []}), \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock, return_value=mock_fk), \
         patch.object(ScaleMaxClient, "is_configured", new_callable=PropertyMock, return_value=True), \
         patch("backend.app.services.search_service.ai_service.client.complete_json_with_timings", new_callable=AsyncMock, return_value=(mock_scalemax_hallucination, {"model_completion_ms": 100, "response_parsing_ms": 1})):

        resp = await search_service.execute_search(query="smartwatch", max_results_per_source=5, use_cache=False)

        assert len(resp.products) == 1
        assert "REAL_ID_100" in resp.products[0].id
        assert resp.products[0].score == 88.0
        assert not any("FAKE_HALLUCINATED_999" in p.id for p in resp.products)


