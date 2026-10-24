import logging
from typing import List, Optional

from backend.app.models.schemas import (
    AppCompareResponse,
    ComparisonCell,
    ComparisonRow,
    Meta,
    Product,
    ProductInsight,
    SearchPlan,
)
from backend.app.services.ai_service import ai_service

logger = logging.getLogger("shopsmart.comparison_service")


class ComparisonService:
    """Manages side-by-side product comparison with ScaleMax AI insights or deterministic matrix calculation."""

    async def compare_products(
        self,
        products: List[Product],
        plan: Optional[SearchPlan] = None,
        criteria: Optional[List[str]] = None,
    ) -> AppCompareResponse:
        """Compares 2-6 products with side-by-side spec matrix and AI insights."""
        if len(products) < 2:
            raise ValueError("Comparison requires at least 2 products.")
        if len(products) > 6:
            raise ValueError("Comparison accepts at most 6 products.")

        if plan is None:
            from backend.app.services.search_service import deterministic_interpret
            plan = deterministic_interpret(products[0].title)

        ai_status: str = "unavailable"
        ai_meta = None
        ai_insights: Optional[List[ProductInsight]] = None
        ai_verdict: Optional[str] = None

        # 1. Deterministic Matrix Rows (Price, Rating, Brand, Specs)
        rows: List[ComparisonRow] = []

        # Price Row
        price_cells = []
        valid_prices = [(p.id, p.price.amount) for p in products if p.price]
        best_price_id = min(valid_prices, key=lambda x: x[1])[0] if valid_prices else None

        for p in products:
            if p.price:
                price_cells.append(ComparisonCell(
                    product_id=p.id,
                    value=f"₹{p.price.amount:g}",
                    numeric_value=p.price.amount,
                    verified=True,
                ))
            else:
                price_cells.append(ComparisonCell(
                    product_id=p.id,
                    value=None,
                    numeric_value=None,
                    verified=False,
                ))

        price_note = None
        if valid_prices and len(valid_prices) >= 2:
            min_p = min(v[1] for v in valid_prices)
            max_p = max(v[1] for v in valid_prices)
            diff = max_p - min_p
            if diff > 0:
                price_note = f"Price difference is ₹{diff:g} across options."

        rows.append(ComparisonRow(
            criterion="Price",
            kind="price",
            cells=price_cells,
            best_product_id=best_price_id,
            note=price_note,
        ))

        # Rating Row
        rating_cells = []
        valid_ratings = [(p.id, p.rating) for p in products if p.rating is not None]
        best_rating_id = max(valid_ratings, key=lambda x: x[1])[0] if valid_ratings else None

        for p in products:
            if p.rating is not None:
                rating_cells.append(ComparisonCell(
                    product_id=p.id,
                    value=f"{p.rating}★ ({p.review_count or 0} reviews)",
                    numeric_value=p.rating,
                    verified=True,
                ))
            else:
                rating_cells.append(ComparisonCell(
                    product_id=p.id,
                    value=None,
                    numeric_value=None,
                    verified=False,
                ))

        rows.append(ComparisonRow(
            criterion="Rating & Reviews",
            kind="rating",
            cells=rating_cells,
            best_product_id=best_rating_id,
            note="Smoothed user satisfaction based on verified reviews.",
        ))

        # Brand & Source
        brand_cells = []
        for p in products:
            brand_cells.append(ComparisonCell(
                product_id=p.id,
                value=f"{p.brand or 'Brand not specified'} ({p.source})",
                numeric_value=None,
                verified=bool(p.brand),
            ))
        rows.append(ComparisonRow(
            criterion="Brand & Source",
            kind="brand",
            cells=brand_cells,
            best_product_id=None,
            note=None,
        ))

        # Common attributes
        all_attr_keys = set()
        for p in products:
            all_attr_keys.update(p.attributes.keys())

        for attr_k in sorted(all_attr_keys)[:6]:
            cells = []
            for p in products:
                val = p.attributes.get(attr_k)
                if val is not None:
                    cells.append(ComparisonCell(
                        product_id=p.id,
                        value=str(val),
                        numeric_value=float(val) if isinstance(val, (int, float)) else None,
                        verified=True,
                    ))
                else:
                    cells.append(ComparisonCell(
                        product_id=p.id,
                        value=None,
                        numeric_value=None,
                        verified=False,
                    ))
            rows.append(ComparisonRow(
                criterion=attr_k,
                kind="attribute",
                cells=cells,
                best_product_id=None,
                note=None,
            ))

        # 2. Try ScaleMax AI Insights if Configured
        if ai_service.client.is_configured:
            ai_status = "connected"
            try:
                ai_res = await ai_service.compare_products(products, plan, criteria)
                if ai_res:
                    ai_status = "ready"
                    ai_verdict = ai_res.get("verdict")
                    insights_raw = ai_res.get("insights", [])
                    ai_insights_map = {i.get("product_id"): i for i in insights_raw}
                    
                    parsed_insights: List[ProductInsight] = []
                    for p in products:
                        raw_i = ai_insights_map.get(p.id)
                        if raw_i:
                            parsed_insights.append(ProductInsight(
                                product_id=p.id,
                                strengths=raw_i.get("strengths", [])[:4],
                                weaknesses=raw_i.get("weaknesses", [])[:4],
                                best_for=raw_i.get("best_for"),
                                unverified=raw_i.get("unverified", []),
                                source="llm",
                            ))
                    if len(parsed_insights) == len(products):
                        ai_insights = parsed_insights

                    ai_meta = Meta(
                        schema_version="1.0",
                        backend="scalemax",
                        model=ai_service.client.model,
                        device_type="cloud-api",
                        latency_ms=ai_res.get("latency_ms", 500),
                        llm_used=True,
                        degraded=False,
                    )
            except Exception as e:
                logger.warning(f"ScaleMax comparison failed: {e}; applying deterministic fallback.")
                ai_status = "degraded"

        # 3. Deterministic Insights Fallback if AI was unavailable or failed
        if not ai_insights:
            deterministic_insights: List[ProductInsight] = []
            for p in products:
                strengths = []
                weaknesses = []
                unverified = []

                if best_price_id == p.id:
                    strengths.append("Lowest price among compared items")
                elif p.price and valid_prices and p.price.amount == max(v[1] for v in valid_prices):
                    weaknesses.append("Highest priced option in this comparison")

                if best_rating_id == p.id:
                    strengths.append("Highest user rating among compared items")
                elif p.rating and p.rating < 3.8:
                    weaknesses.append(f"Sub-4.0 average rating ({p.rating}★)")

                if not p.price:
                    weaknesses.append("Price is unavailable from seller")
                    unverified.append("Current price")

                best_for = "Budget-conscious buyers" if best_price_id == p.id else "Overall reliability"

                deterministic_insights.append(ProductInsight(
                    product_id=p.id,
                    strengths=strengths[:4],
                    weaknesses=weaknesses[:4],
                    best_for=best_for,
                    unverified=unverified,
                    source="deterministic",
                ))
            ai_insights = deterministic_insights

        if not ai_verdict:
            if best_price_id and best_rating_id:
                if best_price_id == best_rating_id:
                    ai_verdict = f"Product {best_price_id} offers both the lowest price and the highest customer rating."
                else:
                    ai_verdict = f"Choose {best_price_id} for the best price, or {best_rating_id} for the highest rated option."

        return AppCompareResponse(
            rows=rows,
            product_insights=ai_insights,
            verdict=ai_verdict,
            ai_status=ai_status,  # type: ignore[arg-type]
            meta=ai_meta,
        )


comparison_service = ComparisonService()
