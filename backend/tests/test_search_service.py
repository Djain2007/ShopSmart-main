import pytest
from unittest.mock import AsyncMock, patch
from backend.app.services.search_service import search_service


@pytest.mark.asyncio
async def test_search_workflow_end_to_end_mocked():
    mock_amazon_res = {
        "source": "amazon.in",
        "status": "success",
        "message": "Found 2 products",
        "products": [
            {
                "id": "AMZ1",
                "title": "Asus TUF Gaming Laptop 16GB RAM",
                "price": "64,990",
                "rating": 4.4,
                "review_count": 520,
                "url": "https://www.amazon.in/dp/AMZ1",
                "image_url": "https://m.media-amazon.com/laptop.jpg",
                "source": "amazon.in",
                "bullets": ["16GB DDR5", "512GB SSD", "RTX 3050"],
            }
        ]
    }

    mock_flipkart_res = {
        "source": "flipkart.com",
        "status": "success",
        "message": "Found 1 product",
        "products": [
            {
                "id": "FK1",
                "title": "Acer Nitro V Gaming Laptop",
                "price": "59,990",
                "rating": 4.2,
                "review_count": 210,
                "url": "https://www.flipkart.com/p/item?pid=FK1",
                "image_url": "https://rukminim2.flixcart.com/laptop.jpg",
                "source": "flipkart.com",
                "bullets": ["16GB RAM", "512GB SSD"],
            }
        ]
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock) as mock_amz, \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock) as mock_fk, \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):
        
        mock_amz.return_value = mock_amazon_res
        mock_fk.return_value = mock_flipkart_res

        resp = await search_service.execute_search(
            query="gaming laptop with 16GB RAM under 70000",
            sources=["amazon.in", "flipkart.com"],
            max_results_per_source=5,
        )

        assert resp.query == "gaming laptop with 16GB RAM under 70000"
        assert resp.counts.received == 2
        assert resp.counts.returned == 2
        assert len(resp.products) == 2
        assert "laptop" in resp.search_plan.category
        assert resp.search_plan.constraints.budget.max == 70000.0
        
        # Verify both retailers are present
        sources = {p.source for p in resp.products}
        assert "amazon.in" in sources
        assert "flipkart.com" in sources

        # Verify unified product structure
        top = resp.products[0]
        assert top.rank == 1
        assert top.score is not None
        assert top.price is not None
        assert top.explanation is not None
        assert len(top.bullet_points) >= 2


@pytest.mark.asyncio
async def test_gym_shoes_under_2500_pipeline_with_amazon_blocked():
    mock_amazon_blocked = {
        "source": "amazon.in",
        "status": "blocked",
        "message": "amazon.in requires a browser verification challenge at this time.",
        "products": [],
    }

    mock_flipkart_shoes = {
        "source": "flipkart.com",
        "status": "success",
        "message": "Found 2 products",
        "products": [
            {
                "id": "SHOHDXRZ6XEP6EJ6",
                "pid": "SHOHDXRZ6XEP6EJ6",
                "title": "Abros MALFOY Casuals For Men",
                "brand": "Abros",
                "price": "₹738",
                "list_price": "₹2,599",
                "rating": None,
                "review_count": None,
                "image_url": "https://rukminim2.flixcart.com/image/612/612/shoe1.jpeg",
                "url": "https://www.flipkart.com/abros-malfoy-casuals-men/p/itm123?pid=SHOHDXRZ6XEP6EJ6",
                "source": "flipkart.com",
                "bullets": [],
            },
            {
                "id": "SHOH8PFQQPRYGUHC",
                "pid": "SHOH8PFQQPRYGUHC",
                "title": "NOBELITE Premium Sports ,Gym, Trending, Stylish Running Shoes For Men",
                "brand": "NOBELITE",
                "price": "₹314",
                "list_price": "₹2,499",
                "rating": None,
                "review_count": None,
                "image_url": "https://rukminim2.flixcart.com/image/612/612/shoe2.jpeg",
                "url": "https://www.flipkart.com/nobelite-shoes/p/itm456?pid=SHOH8PFQQPRYGUHC",
                "source": "flipkart.com",
                "bullets": [],
            },
        ],
    }

    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock) as mock_amz, \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock) as mock_fk, \
         patch("backend.app.services.search_service.ai_service.rank_products", new_callable=AsyncMock, return_value=None):

        mock_amz.return_value = mock_amazon_blocked
        mock_fk.return_value = mock_flipkart_shoes

        resp = await search_service.execute_search(
            query="Gym Shoes under 2500",
            sources=["amazon.in", "flipkart.com"],
            max_results_per_source=5,
            use_cache=False,
        )

        assert resp.query == "Gym Shoes under 2500"
        assert resp.search_plan.category == "footwear"
        assert resp.search_plan.constraints.budget.max == 2500.0

        # Amazon is blocked, Flipkart succeeded
        assert resp.retailer_status["amazon.in"] == "blocked"
        assert resp.retailer_status["flipkart.com"] == "success"

        # Products are NOT lost
        assert len(resp.products) == 2
        assert resp.counts.returned == 2
        prices = {p.price for p in resp.products}
        assert prices == {314.0, 738.0}
        assert all(p.source == "flipkart.com" for p in resp.products)

        # Warnings indicate Amazon was blocked
        assert any("amazon.in requested a human verification challenge" in w for w in resp.warnings)

        # Diagnostics are present
        diag = resp.timings.get("diagnostics", {})
        assert diag.get("returned_count") == 2
        assert diag.get("raw_extracted_count") == 2
        assert diag.get("search_id", "").startswith("srch-")


@pytest.mark.asyncio
async def test_all_retailers_blocked_scenario():
    with patch.object(search_service.scrapers["amazon.in"], "search", new_callable=AsyncMock) as mock_amz, \
         patch.object(search_service.scrapers["flipkart.com"], "search", new_callable=AsyncMock) as mock_fk:

        mock_amz.return_value = {
            "source": "amazon.in",
            "status": "blocked",
            "message": "Challenge required",
            "products": [],
        }
        mock_fk.return_value = {
            "source": "flipkart.com",
            "status": "blocked",
            "message": "Challenge required",
            "products": [],
        }

        resp = await search_service.execute_search(
            query="Gym Shoes under 2500",
            sources=["amazon.in", "flipkart.com"],
            max_results_per_source=5,
            use_cache=False,
        )

        assert len(resp.products) == 0
        assert resp.retailer_status["amazon.in"] == "blocked"
        assert resp.retailer_status["flipkart.com"] == "blocked"
        assert any("verification challenge" in w.lower() for w in resp.warnings)

