from backend.app.services.search_service import extract_budget_fallback, deterministic_interpret


def test_extract_budget():
    lo, hi = extract_budget_fallback("Find laptop under 60000")
    assert lo is None
    assert hi == 60000.0

    lo, hi = extract_budget_fallback("phone below 25k")
    assert lo is None
    assert hi == 25000.0

    lo, hi = extract_budget_fallback("laptop between 40k and 70k")
    assert lo == 40000.0
    assert hi == 70000.0

    lo, hi = extract_budget_fallback("headphones above 3000")
    assert lo == 3000.0
    assert hi is None

    lo, hi = extract_budget_fallback("show gaming laptops")
    assert lo is None
    assert hi is None


def test_deterministic_interpret_plan():
    plan = deterministic_interpret("Looking for ASUS laptop for coding under 75000 with 16GB RAM")
    assert plan.category == "laptop"
    assert plan.constraints.budget.max == 75000.0
    assert "asus" in plan.constraints.preferred_brands
    assert any("16gb" in f.lower() for f in plan.constraints.required_features)
    assert len(plan.search_queries) >= 1
    assert "coding" in (plan.intended_use or "").lower()
    assert plan.sort_preference == "relevance"
