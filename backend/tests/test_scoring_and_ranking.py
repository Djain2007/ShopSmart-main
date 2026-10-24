from datetime import datetime, timezone
from backend.app.models.schemas import Product, Money
from backend.app.services.search_service import passes_deterministic_filters, deterministic_score_product, deterministic_interpret


def make_product(pid: str, price: float, rating: float = 4.0, brand: str = "Dell", bullets: list = None) -> Product:
    return Product(
        id=f"amazon.in:{pid}",
        title=f"{brand} Inspiron Laptop with 16GB RAM",
        brand=brand,
        price=Money(amount=price, currency="INR"),
        rating=rating,
        review_count=100,
        url=f"https://amazon.in/dp/{pid}",
        source="amazon.in",
        retrieved_at=datetime.now(timezone.utc),
        feature_evidence=[{"text": b, "field": "bullet_points"} for b in (bullets or ["16GB RAM"])],
    )


def test_passes_deterministic_filters():
    plan = deterministic_interpret("Laptop under 50000")
    
    p_in = make_product("IN", 45000.0)
    passes_in, _, _ = passes_deterministic_filters(p_in, plan)
    assert passes_in is True

    p_out = make_product("OUT", 55000.0)
    passes_out, reasons, _ = passes_deterministic_filters(p_out, plan)
    assert passes_out is False
    assert "over_budget" in reasons

    # Excluded brand test
    plan.constraints.excluded_brands = ["dell"]
    passes_brand, reasons_b, _ = passes_deterministic_filters(p_in, plan)
    assert passes_brand is False
    assert "excluded_brand" in reasons_b


def test_deterministic_scoring_logic():
    plan = deterministic_interpret("Laptop with 16GB RAM under 60000")
    
    p1 = make_product("P1", 40000.0, rating=4.5)
    p2 = make_product("P2", 58000.0, rating=3.5)

    s1, conf1, bd1, _, _, _ = deterministic_score_product(p1, plan, 40000.0, 58000.0)
    s2, conf2, bd2, _, _, _ = deterministic_score_product(p2, plan, 40000.0, 58000.0)

    # Cheaper + higher rated product P1 should have higher score than P2
    assert s1 > s2
    assert bd1.rating.score > bd2.rating.score
    assert bd1.value.score > bd2.value.score
    assert conf1 in ("high", "medium")
