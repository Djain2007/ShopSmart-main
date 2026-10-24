import pytest
from datetime import datetime, timezone
from backend.app.models.schemas import Product, Money
from backend.app.services.comparison_service import ComparisonService


def make_test_product(pid: str, price: float, rating: float, brand: str) -> Product:
    return Product(
        id=f"amazon.in:{pid}",
        title=f"{brand} Laptop 15",
        brand=brand,
        price=Money(amount=price, currency="INR"),
        rating=rating,
        review_count=150,
        url=f"https://amazon.in/dp/{pid}",
        source="amazon.in",
        attributes={"RAM": "16GB", "SSD": "512GB"},
        retrieved_at=datetime.now(timezone.utc),
    )


from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_deterministic_comparison():
    service = ComparisonService()
    p1 = make_test_product("P1", 45000.0, 4.2, "Dell")
    p2 = make_test_product("P2", 42000.0, 4.5, "Asus")
    with patch("backend.app.services.comparison_service.ai_service.compare_products", new_callable=AsyncMock, return_value=None):
        resp = await service.compare_products([p1, p2])

    assert len(resp.rows) >= 3
    # Price row
    price_row = next(r for r in resp.rows if r.kind == "price")
    assert price_row.best_product_id == p2.id  # 42000 is cheaper than 45000
    assert "₹3000" in (price_row.note or "")

    # Rating row
    rating_row = next(r for r in resp.rows if r.kind == "rating")
    assert rating_row.best_product_id == p2.id  # 4.5 is higher than 4.2

    # Product insights
    assert len(resp.product_insights) == 2
    assert resp.product_insights[1].product_id == p2.id
    assert any("Lowest price" in s for s in resp.product_insights[1].strengths)
