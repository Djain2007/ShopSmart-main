import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.config import settings
from backend.app.models.schemas import (
    AIConfigUpdateRequest,
    AppChatRequest,
    AppCompareRequest,
    AppCompareResponse,
    AppSearchRequest,
    AppSearchResponse,
    Product,
)
from backend.app.services.ai_service import ai_service
from backend.app.services.comparison_service import comparison_service
from backend.app.services.history_service import history_service
from backend.app.services.product_normalizer import normalize_raw_product
from backend.app.services.search_service import deterministic_interpret, search_service

logger = logging.getLogger("shopsmart.api")

router = APIRouter(prefix="/api")

# In-memory cache of currently active searched products by id for fast compare/chat resolution
_PRODUCT_CACHE: Dict[str, Product] = {}


def cache_products(products: List[Product]) -> None:
    for p in products:
        _PRODUCT_CACHE[p.id] = p
    # Keep cache bounded to latest 200 products
    if len(_PRODUCT_CACHE) > 200:
        keys_to_remove = list(_PRODUCT_CACHE.keys())[:-150]
        for k in keys_to_remove:
            _PRODUCT_CACHE.pop(k, None)


@router.post("/search", response_model=AppSearchResponse)
async def search(req: AppSearchRequest):
    """Execute natural-language shopping search workflow."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    try:
        res = await search_service.execute_search(
            query=req.query,
            sources=req.sources,
            max_results_per_source=req.max_results_per_source,
            budget_max=req.budget_max,
            sort_by=req.sort_by,
        )

        # Cache valid products for compare and chat
        for up in res.products:
            p_model = normalize_raw_product(up.model_dump(), up.source)
            if p_model:
                _PRODUCT_CACHE[p_model.id] = p_model

        return res
    except Exception as e:
        logger.error(f"Search failed for query '{req.query}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/compare", response_model=AppCompareResponse)
async def compare(req: AppCompareRequest, raw_products: Optional[List[Dict[str, Any]]] = None):
    """Compare 2 to 6 products."""
    if len(req.product_ids) < 2 or len(req.product_ids) > 6:
        raise HTTPException(
            status_code=400,
            detail="Comparison requires between 2 and 6 products.",
        )

    # Resolve products from cache or payload
    selected_products: List[Product] = []
    
    # 1. From cache
    for pid in req.product_ids:
        if pid in _PRODUCT_CACHE:
            selected_products.append(_PRODUCT_CACHE[pid])

    # 2. From saved items if missing
    if len(selected_products) < len(req.product_ids):
        saved = await history_service.get_saved_products()
        saved_map = {s["product_id"]: s.get("product_details", {}) for s in saved}
        for pid in req.product_ids:
            if pid not in [p.id for p in selected_products] and pid in saved_map:
                p_norm = normalize_raw_product(saved_map[pid], saved_map[pid].get("source", "amazon.in"))
                if p_norm:
                    selected_products.append(p_norm)

    if len(selected_products) < 2:
        raise HTTPException(
            status_code=404,
            detail="Could not resolve at least 2 valid products for comparison. Please ensure products are selected from search results.",
        )

    try:
        return await comparison_service.compare_products(
            products=selected_products,
            criteria=req.criteria,
        )
    except Exception as e:
        logger.error(f"Comparison failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@router.post("/chat")
async def chat(req: AppChatRequest):
    """Chat assistant grounded in currently searched or compared products."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Resolve products
    products: List[Product] = []
    if req.product_ids:
        for pid in req.product_ids:
            if pid in _PRODUCT_CACHE:
                products.append(_PRODUCT_CACHE[pid])
    if not products:
        # Use latest cached products
        products = list(_PRODUCT_CACHE.values())[:10]

    if not products:
        return {
            "answer": "Please perform a search first so I can answer questions grounded in real product specifications.",
            "referenced_product_ids": [],
            "suggested_followups": ["Show laptops under 50000", "Find wireless headphones with ANC"],
            "answer_source": "deterministic",
        }

    plan = deterministic_interpret(req.message)

    # Call ScaleMax AI chat if ready
    try:
        ready_resp = await ai_service.check_ready()
        if ready_resp and ready_resp.ready:
            ai_chat_resp = await ai_service.chat(
                plan=plan,
                products=products,
                message=req.message,
                history=req.history,
            )
            if ai_chat_resp:
                return ai_chat_resp
    except Exception as e:
        logger.warning(f"ScaleMax AI chat call failed: {e}")

    # Deterministic factual fallback answer
    msg_low = req.message.lower()
    ref_ids = []
    
    # Check for price inquiries
    if "cheapest" in msg_low or "lowest price" in msg_low or "best price" in msg_low:
        priced = [p for p in products if p.price]
        if priced:
            best = min(priced, key=lambda x: x.price.amount)
            ref_ids.append(best.id)
            answer = f"The lowest priced option is **{best.title}** at **₹{best.price.amount:g}** on {best.source}."
        else:
            answer = "None of the currently loaded products have verified prices available."
    elif "rating" in msg_low or "highest rated" in msg_low or "best rated" in msg_low:
        rated = [p for p in products if p.rating is not None]
        if rated:
            best = max(rated, key=lambda x: (x.rating or 0))
            ref_ids.append(best.id)
            answer = f"The highest rated product is **{best.title}** with **{best.rating}★** ({best.review_count or 0} reviews) on {best.source}."
        else:
            answer = "User ratings are currently unverified for the selected products."
    else:
        # Factual summary of top product
        top = products[0]
        ref_ids.append(top.id)
        bullets_text = " • " + "\n • ".join([e.text for e in top.feature_evidence[:3]]) if top.feature_evidence else ""
        price_str = f"₹{top.price.amount:g}" if top.price else "price unavailable"
        rating_str = f"{top.rating}★" if top.rating else "no rating"
        answer = f"Regarding **{top.title}** ({price_str}, {rating_str} on {top.source}):\n{bullets_text}\n\nLet me know if you would like me to compare specific features or find alternatives."

    followups = [
        "Which product has the best rating?",
        "What is the cheapest option?",
        "Compare top 2 products side by side",
    ]

    return {
        "answer": answer,
        "referenced_product_ids": ref_ids,
        "suggested_followups": followups,
        "answer_source": "deterministic",
    }


@router.get("/status")
async def get_status():
    """Returns ScaleMax AI health/readiness status and retailer scraper availability."""
    ai_ready = await ai_service.check_ready()
    ai_health = await ai_service.check_health()

    ai_state = "unavailable"
    if ai_ready and ai_ready.ready:
        ai_state = "ready"
    elif settings.is_ai_configured:
        ai_state = "connected"

    return {
        "ai_status": ai_state,
        "ai_config": settings.get_public_status(),
        "ai_health": ai_health.model_dump() if ai_health else None,
        "ai_ready": ai_ready.model_dump() if ai_ready else None,
        "retailers": {
            "amazon.in": {"name": "Amazon India", "status": "active"},
            "flipkart.com": {"name": "Flipkart", "status": "active"},
        },
    }


@router.post("/config/ai")
async def update_ai_config(req: AIConfigUpdateRequest):
    """Allows updating ScaleMax base URL, API key, and model dynamically from the UI or API."""
    settings.update_ai_config(base_url=req.base_url, api_key=req.api_key, model=req.model)
    
    # Re-check readiness
    ready = await ai_service.check_ready()
    health = await ai_service.check_health()

    status_str = "ready" if (ready and ready.ready) else ("connected" if settings.is_ai_configured else "unavailable")

    return {
        "message": "ScaleMax AI configuration updated successfully.",
        "ai_status": status_str,
        "ai_config": settings.get_public_status(),
        "ready": ready.model_dump() if ready else None,
    }


# ---------------------------------------------------------------- Search History
@router.get("/history")
async def get_history(limit: int = Query(25, ge=1, le=100)):
    """Retrieve past search queries."""
    return await history_service.get_search_history(limit=limit)


@router.delete("/history")
async def clear_history():
    """Clear search history."""
    success = await history_service.clear_search_history()
    return {"success": success}


# ---------------------------------------------------------------- Saved Products
@router.get("/saved")
async def get_saved_products():
    """Retrieve saved favorites."""
    return await history_service.get_saved_products()


@router.post("/saved")
async def save_product(product: Dict[str, Any]):
    """Add a product to saved favorites."""
    success = await history_service.save_product(product)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to save product.")
    return {"success": True, "message": "Product saved."}


@router.delete("/saved/{product_id}")
async def remove_saved_product(product_id: str):
    """Remove a product from saved favorites."""
    success = await history_service.remove_saved_product(product_id)
    return {"success": success}
