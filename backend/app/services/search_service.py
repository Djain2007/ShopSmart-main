import asyncio
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

from backend.app.models.schemas import (
    LIMITS,
    AppSearchResponse,
    Budget,
    Constraints,
    Counts,
    ExcludedProduct,
    Explanation,
    Product,
    RankedProduct,
    ScoreBreakdown,
    ScoreComponent,
    SearchPlan,
    SourceName,
    UnifiedProduct,
)
from backend.app.config import settings
from backend.app.scrapers.amazon import AmazonScraper
from backend.app.scrapers.flipkart import FlipkartScraper
from backend.app.services.ai_service import ai_service
from backend.app.services.history_service import history_service
from backend.app.services.product_normalizer import deduplicate_products, normalize_raw_product
from backend.app.services.search_cache import search_cache

logger = logging.getLogger("shopsmart.search_service")

STOPWORDS = set(
    """a an the and or of for to in on at with without from by is are was were be been
    laptop phone mobile smartphone headphone earphone earbuds tv television watch monitor
    keyboard mouse tablet camera under below above between rs inr rupee rupees buy find show me
    want need looking for best good cheap budget premium high low""".split()
)

KNOWN_BRANDS = [
    "apple", "samsung", "hp", "dell", "lenovo", "asus", "acer", "msi", "sony", "boat",
    "noise", "oneplus", "xiaomi", "redmi", "realme", "motorola", "lg", "jbl", "boult",
    "fire-boltt", "zebronics", "canon", "nikon", "oppo", "vivo", "iqoo", "poco", "google",
    "infinix", "honor", "marshall", "sennheiser", "bose", "nike", "adidas", "puma",
    "reebok", "skechers", "asics", "abros", "campus", "sparx", "woodland", "red tape", "bata"
]

CATEGORY_PATTERNS = [
    (r"\b(laptop|notebook|macbook|chromebook)\b", "laptop"),
    (r"\b(phone|smartphone|mobile|iphone)\b", "smartphone"),
    (r"\b(headphone|earphone|earbuds|airpods|tws)\b", "audio"),
    (r"\b(smartwatch|smart watch|fitness band)\b", "smartwatch"),
    (r"\b(tablet|ipad)\b", "tablet"),
    (r"\b(television|tv|smart tv|led tv)\b", "television"),
    (r"\b(camera|dslr|mirrorless)\b", "camera"),
    (r"\b(monitor|display screen)\b", "monitor"),
    (r"\b(shoe|shoes|sneaker|sneakers|footwear|boots|sandals|running shoes|gym shoes)\b", "footwear"),
    (r"\b(shirt|tshirt|t-shirt|jeans|jacket|hoodie|clothing|apparel)\b", "apparel"),
]

BASE_WEIGHTS = {
    "required_features": 25.0,
    "value": 18.0,
    "relevance": 15.0,
    "rating": 12.0,
    "budget": 10.0,
    "brand": 8.0,
    "preferred_features": 7.0,
    "data_quality": 5.0,
}


def _to_amount(num_str: str, suffix: Optional[str]) -> float:
    n = float(num_str.replace(",", ""))
    s = (suffix or "").lower()
    if "l" in s:
        return n * 100_000.0
    if "k" in s:
        return n * 1_000.0
    return n


def extract_budget_fallback(query: str) -> Tuple[Optional[float], Optional[float]]:
    """Deterministic budget extraction for fallbacks."""
    q = query.lower()
    
    # "between X and Y"
    m_range = re.search(r"between\s+(?:₹|rs\.?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh)?\s*(?:and|to|-)\s*(?:₹|rs\.?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh)?", q)
    if m_range:
        lo = _to_amount(m_range.group(1), m_range.group(2))
        hi = _to_amount(m_range.group(3), m_range.group(4))
        return min(lo, hi), max(lo, hi)

    # "under X" or "below X" or "budget X"
    m_max = re.search(r"(?:under|below|less than|within|budget(?:\s+of)?|max(?:\s+budget)?)\s+(?:₹|rs\.?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh)?", q)
    if m_max:
        hi = _to_amount(m_max.group(1), m_max.group(2))
        return None, hi

    # "above X" or "at least X"
    m_min = re.search(r"(?:above|over|more than|at least|min(?:\s+budget)?)\s+(?:₹|rs\.?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh)?", q)
    if m_min:
        lo = _to_amount(m_min.group(1), m_min.group(2))
        return lo, None

    return None, None


def deterministic_interpret(query: str, sources: Optional[List[SourceName]] = None, max_results: int = 10) -> SearchPlan:
    """Builds a schema-valid SearchPlan deterministically in < 1ms."""
    clean_q = " ".join(query.strip().split())
    low = clean_q.lower()
    
    b_min, b_max = extract_budget_fallback(clean_q)
    category = next((cat for pat, cat in CATEGORY_PATTERNS if re.search(pat, low)), None)
    
    # Brand detection
    pref_brands = [b for b in KNOWN_BRANDS if re.search(r"\b" + re.escape(b) + r"\b", low)]
    
    # Intended use
    intended_use = None
    m_use = re.search(r"\bfor\s+([a-z0-9\s]{3,30})(?:\s+under|\s+with|\s+and|$)", low)
    if m_use:
        cand = m_use.group(1).strip()
        if cand and cand not in STOPWORDS:
            intended_use = cand[:120]

    # Required features heuristic
    features = []
    for spec in re.findall(r"\b(\d+\s?(?:gb|tb|hz|mp|mah|w)\b|\b(?:anc|amoled|oled|4k|5g|metal|backlit)\b)", low):
        spec_clean = spec.strip()
        if spec_clean not in features:
            features.append(spec_clean)

    # Search queries for scrapers
    queries = []
    core_terms = [t for t in re.findall(r"[a-z0-9]+", low) if t not in STOPWORDS and not t.isdigit()]
    if core_terms:
        queries.append(" ".join(core_terms[:6]))
    if category:
        if not queries:
            queries.append(category)
        elif category not in queries[0]:
            queries.append(f"{queries[0]} {category}"[:80])
    if not queries:
        queries = [clean_q[:80]]

    # Comparison criteria
    comp_crit = ["Price", "Rating", "Brand"]
    if category in ("laptop", "tablet", "smartphone"):
        comp_crit.extend(["Processor", "RAM", "Storage", "Display"])
    elif category == "audio":
        comp_crit.extend(["Battery Life", "Noise Cancellation", "Connectivity"])

    return SearchPlan(
        schema_version="1.0",
        original_query=clean_q,
        category=category,
        intended_use=intended_use,
        constraints=Constraints(
            budget=Budget(min=b_min, max=b_max, currency="INR"),
            preferred_brands=pref_brands[:LIMITS["list_items_max"]],
            excluded_brands=[],
            required_features=features[:LIMITS["list_items_max"]],
            preferred_features=[],
            excluded_features=[],
        ),
        search_terms=core_terms[:6],
        search_queries=queries[:LIMITS["search_queries_max"]],
        sources=sources or ["amazon.in", "flipkart.com"],
        max_results_per_source=max_results,
        comparison_criteria=comp_crit[:LIMITS["compare_criteria_max"]],
        sort_preference="relevance",
        clarification=None,
        warnings=[],
    )


def deterministic_score_product(p: Product, plan: SearchPlan, min_p: Optional[float], max_p: Optional[float]) -> Tuple[float, str, ScoreBreakdown, List[str], List[str], List[str]]:
    """Calculates factual deterministic score 0-100 according to contract scoring rules."""
    c = plan.constraints
    b = c.budget
    flags = []
    matched = []
    unverified = []

    text_haystack = f"{p.title} {' '.join(str(v) for v in p.attributes.values())} {' '.join(e.text for e in p.feature_evidence)}".lower()
    for rf in c.required_features:
        if rf.lower() in text_haystack:
            matched.append(rf)
        else:
            unverified.append(rf)

    # 1. Budget component
    price_val = p.price.amount if p.price else None
    if b.min is not None or b.max is not None:
        if price_val is not None:
            budget_score = 1.0
        else:
            budget_score = 0.3
            flags.append("price_unavailable")
    else:
        budget_score = 1.0

    # 2. Required features component
    if c.required_features:
        req_score = len(matched) / max(1, len(c.required_features))
    else:
        req_score = 1.0

    # 3. Rating component (smoothed Bayesian prior 3.8)
    if p.rating is not None:
        revs = p.review_count or 0
        smoothed = (revs * p.rating + 50.0 * 3.8) / (revs + 50.0)
        rating_score = max(0.0, min(1.0, (smoothed - 2.5) / 2.5))
    else:
        rating_score = max(0.0, min(1.0, (3.8 - 2.5) / 2.5))
        flags.append("rating_unavailable")

    # 4. Brand component
    if c.preferred_brands:
        p_brand = (p.brand or "").lower()
        if any(pb.lower() in p_brand or pb.lower() in p.title.lower() for pb in c.preferred_brands):
            brand_score = 1.0
        elif not p.brand:
            brand_score = 0.3
        else:
            brand_score = 0.0
    else:
        brand_score = 1.0

    # 5. Value component
    if min_p is not None and max_p is not None and max_p > min_p and price_val is not None:
        pos = (max_p - price_val) / (max_p - min_p)
        value_score = 0.5 + 0.5 * pos
    elif price_val is not None:
        value_score = 0.75
    else:
        value_score = 0.25

    # 6. Data quality
    dq_count = (1 if p.price else 0) + (1 if p.rating else 0) + (1 if p.review_count else 0) + (1 if p.image_url else 0)
    data_quality_score = dq_count / 4.0

    # 7. Relevance (keyword overlap)
    terms = plan.search_terms + ([plan.category] if plan.category else [])
    if terms:
        hits = sum(1 for t in terms if t.lower() in text_haystack)
        relevance_score = hits / len(terms)
    else:
        relevance_score = 0.8

    # Weights
    w = dict(BASE_WEIGHTS)
    if plan.sort_preference == "price_asc":
        w["value"] *= 2.0
    elif plan.sort_preference in ("rating_desc", "review_count_desc"):
        w["rating"] *= 2.0

    total_w = sum(w.values())
    norm_w = {k: v / total_w for k, v in w.items()}

    breakdown_map = {}
    comps = {
        "required_features": (req_score, bool(c.required_features)),
        "budget": (budget_score, bool(b.min is not None or b.max is not None)),
        "rating": (rating_score, True),
        "brand": (brand_score, bool(c.preferred_brands)),
        "value": (value_score, True),
        "data_quality": (data_quality_score, True),
        "relevance": (relevance_score, True),
        "preferred_features": (1.0, False),
    }

    final_score = 0.0
    for k, (s_val, app) in comps.items():
        eff_w = norm_w[k]
        contrib = s_val * eff_w * 100.0
        final_score += contrib
        breakdown_map[k] = ScoreComponent(
            applicable=app,
            score=round(s_val, 3),
            weight=round(eff_w, 3),
            contribution=round(contrib, 2),
            source="deterministic",
            note=None,
        )

    score_final = max(0.0, min(100.0, round(final_score, 1)))

    if data_quality_score >= 0.8 and p.price and p.rating and not unverified:
        confidence = "high"
    elif data_quality_score < 0.5 or not p.price:
        confidence = "low"
    else:
        confidence = "medium"

    breakdown_obj = ScoreBreakdown(**breakdown_map)
    return score_final, confidence, breakdown_obj, matched, unverified, flags


def passes_deterministic_filters(p: Product, plan: SearchPlan) -> Tuple[bool, List[str], List[str]]:
    """Checks hard budget, brand, and feature exclusion filters."""
    c = plan.constraints
    b = c.budget
    reasons = []
    detail = []

    if p.price is not None and p.price.currency == b.currency:
        if b.max is not None and p.price.amount > b.max:
            reasons.append("over_budget")
            detail.append(f"Price ₹{p.price.amount:g} exceeds max budget ₹{b.max:g}")
        if b.min is not None and p.price.amount < b.min:
            reasons.append("under_min_budget")
            detail.append(f"Price ₹{p.price.amount:g} is below min budget ₹{b.min:g}")

    if c.excluded_brands:
        t_low = (f"{p.brand or ''} {p.title}").lower()
        for eb in c.excluded_brands:
            if re.search(r"\b" + re.escape(eb.lower()) + r"\b", t_low):
                reasons.append("excluded_brand")
                detail.append(f"Brand '{eb}' is excluded")
                break

    return len(reasons) == 0, reasons, detail


class SearchService:
    """
    High-performance search service orchestrating parallel retailer discovery,
    in-memory caching, deterministic fast filtering, and optional ScaleMax ranking.
    """

    def __init__(self):
        self.scrapers = {
            "amazon.in": AmazonScraper(),
            "flipkart.com": FlipkartScraper(),
        }
        self.retailer_deadline_seconds = getattr(settings, "retailer_timeout", 7.5)
        self.ai_ranking_deadline_seconds = getattr(settings, "scalemax_ranking_timeout", 10.0)
        self.search_total_deadline_seconds = getattr(settings, "search_total_deadline", 18.0)
        self._in_flight_searches: Dict[str, asyncio.Task] = {}

    async def execute_search(
        self,
        query: str,
        sources: Optional[List[SourceName]] = None,
        max_results_per_source: int = 10,
        budget_max: Optional[float] = None,
        sort_by: Optional[str] = None,
        use_cache: bool = True,
        enable_ai_ranking: bool = True,
    ) -> AppSearchResponse:
        """
        Optimized shopping search pipeline with Monotonic Timing, Request Coalescing and Cache Acceleration.
        """
        t_start = time.perf_counter()
        requested_sources = sources or ["amazon.in", "flipkart.com"]

        # Check Cache First
        cache_key = search_cache.normalize_key(
            query, requested_sources, max_results_per_source, budget_max, sort_by, enable_ai_ranking=enable_ai_ranking
        )
        if use_cache:
            cached_entry = search_cache.get(cache_key)
            if cached_entry:
                resp: AppSearchResponse = cached_entry["data"]
                total_ms = int((time.perf_counter() - t_start) * 1000)
                # Clone and attach fresh timings
                resp_copy = resp.model_copy(deep=True)
                if not hasattr(resp_copy, "timings") or resp_copy.timings is None:
                    resp_copy.timings = {}
                resp_copy.timings = {
                    "total_duration_ms": total_ms,
                    "cache_hit": True,
                    "cache_age_seconds": cached_entry["cache_age_seconds"],
                    "cached_at": cached_entry["cached_at"],
                }
                return resp_copy

        # In-Flight Request Coalescing (avoid parallel duplicate scraping or LLM calls for identical query)
        if cache_key in self._in_flight_searches and not self._in_flight_searches[cache_key].done():
            try:
                res = await asyncio.shield(self._in_flight_searches[cache_key])
                return res.model_copy(deep=True)
            except (Exception, asyncio.CancelledError):
                pass

        # Create worker task and shield it
        worker_task = asyncio.create_task(
            self._run_search_pipeline(
                query=query,
                sources=requested_sources,
                max_results_per_source=max_results_per_source,
                budget_max=budget_max,
                sort_by=sort_by,
                cache_key=cache_key,
                t_start=t_start,
                enable_ai_ranking=enable_ai_ranking,
            )
        )
        self._in_flight_searches[cache_key] = worker_task

        try:
            return await asyncio.shield(worker_task)
        except asyncio.CancelledError:
            # If the calling client disconnected, the shielded worker_task continues
            # to finish scraping and populate cache safely without duplicating work.
            raise
        finally:
            if worker_task.done():
                self._in_flight_searches.pop(cache_key, None)

    async def _run_search_pipeline(
        self,
        query: str,
        sources: List[SourceName],
        max_results_per_source: int,
        budget_max: Optional[float],
        sort_by: Optional[str],
        cache_key: str,
        t_start: float,
        enable_ai_ranking: bool = True,
    ) -> AppSearchResponse:
        search_id = f"srch-{uuid.uuid4().hex[:12]}"
        timings: Dict[str, Any] = {"search_id": search_id, "cache_hit": False}

        # 1. Instant Fast Query Interpretation (< 1ms)
        t_interp_start = time.perf_counter()
        search_plan = deterministic_interpret(query, sources, max_results_per_source)
        
        # Override with explicit filters if requested
        if budget_max is not None and budget_max > 0:
            search_plan.constraints.budget.max = budget_max
        if sort_by and sort_by in ("relevance", "price_asc", "price_desc", "rating_desc", "review_count_desc"):
            search_plan.sort_preference = sort_by

        timings["interpretation_ms"] = int((time.perf_counter() - t_interp_start) * 1000)

        # 2. Parallel Retailer Searches with Individual Timings and Strict Deadline
        retailer_sources = [s for s in search_plan.sources if s in self.scrapers]
        search_query_term = search_plan.search_queries[0] if search_plan.search_queries else query

        t_scrape_start = time.perf_counter()
        retailer_timings: Dict[str, int] = {}

        async def _scrape_retailer(src_name: SourceName) -> Tuple[SourceName, Any, int]:
            s_t0 = time.perf_counter()
            scraper = self.scrapers[src_name]
            try:
                res = await scraper.search(search_query_term, max_results=search_plan.max_results_per_source)
                s_ms = int((time.perf_counter() - s_t0) * 1000)
                return src_name, res, s_ms
            except Exception as e:
                s_ms = int((time.perf_counter() - s_t0) * 1000)
                return src_name, e, s_ms

        scrape_tasks = [asyncio.create_task(_scrape_retailer(src)) for src in retailer_sources]

        # Wait with overall deadline
        try:
            done, pending = await asyncio.wait(
                scrape_tasks,
                timeout=self.retailer_deadline_seconds,
                return_when=asyncio.ALL_COMPLETED,
            )
        except Exception:
            done, pending = set(), set(scrape_tasks)

        # Cancel any pending slow scrapers that exceeded search deadline
        for p_task in pending:
            p_task.cancel()

        retailer_status: Dict[str, str] = {}
        raw_items_collected: List[Dict[str, Any]] = []

        for task_obj in done:
            try:
                src_name, res, s_ms = task_obj.result()
                retailer_timings[src_name] = s_ms
                if isinstance(res, Exception):
                    retailer_status[src_name] = f"error: {type(res).__name__}"
                elif isinstance(res, dict):
                    retailer_status[src_name] = res.get("status", "error")
                    raw_items_collected.extend(res.get("products", []))
                else:
                    retailer_status[src_name] = "error"
            except Exception as e:
                logger.error(f"Error extracting scraper result: {e}")

        # Mark pending/timed-out retailers
        for src in retailer_sources:
            if src not in retailer_status:
                retailer_status[src] = "timeout"
                retailer_timings[src] = int(self.retailer_deadline_seconds * 1000)

        timings["retailer_search_ms"] = int((time.perf_counter() - t_scrape_start) * 1000)
        timings["retailer_timings"] = retailer_timings

        # 3. Product Normalization & Deduplication (< 2ms)
        t_norm_start = time.perf_counter()
        normalized_products: List[Product] = []
        for raw in raw_items_collected:
            src_name = raw.get("source", "amazon.in")
            p = normalize_raw_product(raw, src_name)
            if p:
                normalized_products.append(p)

        canonical_products = deduplicate_products(normalized_products)

        # 4. Deterministic Filtering
        valid_products: List[Product] = []
        excluded_list: List[ExcludedProduct] = []

        for p in canonical_products:
            passes, reasons, detail = passes_deterministic_filters(p, search_plan)
            if passes:
                valid_products.append(p)
            else:
                excluded_list.append(ExcludedProduct(
                    product_id=p.id,
                    reasons=reasons,  # type: ignore[arg-type]
                    detail=detail,
                ))

        timings["normalization_and_dedup_ms"] = int((time.perf_counter() - t_norm_start) * 1000)

        # Min / max prices
        prices = [p.price.amount for p in valid_products if p.price and p.price.currency == search_plan.constraints.budget.currency]
        min_p = min(prices) if prices else None
        max_p = max(prices) if prices else None

        # Pre-score all valid products deterministically so top candidates sent to ScaleMax are highest quality
        scored_candidates = []
        for p in valid_products:
            sc, _, _, _, _, _ = deterministic_score_product(p, search_plan, min_p, max_p)
            scored_candidates.append((sc, p))
        scored_candidates.sort(key=lambda x: -x[0])
        sorted_valid_products = [p for _, p in scored_candidates]

        # 5. AI Ranking via ScaleMax (with bounded timeout and fallback)
        t_rank_start = time.perf_counter()
        ranked_products_map: Dict[str, RankedProduct] = {}
        ai_summary = None
        ai_meta = None
        ai_status: str = "unavailable"
        submitted_count = 0

        if enable_ai_ranking and ai_service.client.is_configured and valid_products:
            ai_status = "connected"
            try:
                # Top 3 highest scored candidates sent to ScaleMax (guarantees fast ~5-7s response within 10s budget)
                candidates_for_llm = sorted_valid_products[:3]
                submitted_count = len(candidates_for_llm)
                rank_resp = await asyncio.wait_for(
                    ai_service.rank_products(
                        plan=search_plan,
                        products=candidates_for_llm,
                        top_k=min(3, len(candidates_for_llm)),
                        include_explanations=True,
                    ),
                    timeout=self.ai_ranking_deadline_seconds + 0.5,
                )
                if rank_resp and rank_resp.ranked:
                    for rp in rank_resp.ranked:
                        ranked_products_map[rp.product_id] = rp
                    ai_summary = rank_resp.overall_summary
                    ai_meta = rank_resp.meta
                    ai_status = "ready"
                    timings["ai_ranking_status"] = "successful"
                    if rank_resp.notes:
                        for note_str in rank_resp.notes:
                            try:
                                note_dict = json.loads(note_str)
                                if "scalemax_detailed_timings" in note_dict:
                                    timings["scalemax_detailed_timings"] = note_dict["scalemax_detailed_timings"]
                            except Exception:
                                pass
                else:
                    ai_status = "degraded"
                    timings["ai_ranking_status"] = "empty_result"
            except asyncio.TimeoutError:
                logger.warning(f"ScaleMax ranking timed out after {self.ai_ranking_deadline_seconds}s; fallback applied.")
                ai_status = "degraded"
                timings["ai_ranking_status"] = "timed_out"
            except Exception as e:
                logger.warning(f"ScaleMax ranking failed: {e}; fallback applied.")
                ai_status = "degraded"
                timings["ai_ranking_status"] = f"failed: {type(e).__name__}"

        timings["ai_ranking_ms"] = int((time.perf_counter() - t_rank_start) * 1000)

        # 6. Build Unified Products
        unified_products: List[UnifiedProduct] = []
        saved_ids = await history_service.get_saved_product_ids()

        for idx, p in enumerate(valid_products):
            if p.id in ranked_products_map:
                rp = ranked_products_map[p.id]
                rank_num = rp.rank
                score = rp.score
                confidence = rp.confidence
                matched = rp.matched_features
                unverified = rp.unverified_features
                flags = rp.flags
                score_bd = rp.score_breakdown
                expl = rp.explanation
            else:
                score, confidence, score_bd, matched, unverified, flags = deterministic_score_product(p, search_plan, min_p, max_p)
                rank_num = idx + 1
                
                pros = []
                cons = []
                if p.price:
                    pros.append(f"Priced at ₹{p.price.amount:g}")
                if p.rating and p.rating >= 4.0:
                    pros.append(f"Strong rating of {p.rating}★")
                if matched:
                    pros.append(f"Matches requested: {', '.join(matched[:2])}")
                if not p.price:
                    cons.append("Price is unavailable from retailer")
                if p.rating and p.rating < 3.5:
                    cons.append(f"Lower user rating ({p.rating}★)")
                if unverified:
                    cons.append(f"Unverified features: {', '.join(unverified[:2])}")

                expl = Explanation(
                    summary=f"Match score {score}/100 based on factual specifications.",
                    pros=pros[:4],
                    cons=cons[:4],
                    unverified=unverified[:8],
                    source="deterministic",
                )

            up = UnifiedProduct(
                id=p.id,
                title=p.title,
                brand=p.brand,
                price=p.price.amount if p.price else None,
                list_price=p.list_price.amount if p.list_price else None,
                currency=p.price.currency if p.price else "INR",
                rating=p.rating,
                review_count=p.review_count,
                image_url=p.image_url,
                url=p.url,
                source=p.source,
                attributes=p.attributes,
                bullet_points=[e.text for e in p.feature_evidence],
                retrieved_at=p.retrieved_at.isoformat(),
                rank=rank_num,
                score=score,
                confidence=confidence,
                matched_features=matched,
                unverified_features=unverified,
                flags=flags,
                explanation=expl,
                score_breakdown=score_bd,
                is_saved=(p.id in saved_ids),
            )
            unified_products.append(up)

        # Sort Unified Products according to user preference
        if search_plan.sort_preference == "price_asc":
            unified_products.sort(key=lambda x: (x.price is None, x.price or 0))
        elif search_plan.sort_preference == "price_desc":
            unified_products.sort(key=lambda x: (x.price is None, -(x.price or 0)))
        elif search_plan.sort_preference == "rating_desc":
            unified_products.sort(key=lambda x: (x.rating is None, -(x.rating or 0), -(x.review_count or 0)))
        elif search_plan.sort_preference == "review_count_desc":
            unified_products.sort(key=lambda x: (x.review_count is None, -(x.review_count or 0)))
        else:
            unified_products.sort(key=lambda x: -(x.score or 0))

        # Re-assign ranks 1..N after sort
        for r_idx, up in enumerate(unified_products):
            up.rank = r_idx + 1

        counts = Counts(
            received=len(canonical_products),
            excluded=len(excluded_list),
            ranked=len(valid_products),
            returned=len(unified_products),
        )

        # Persist to search history
        plan_summary = f"{search_plan.category or 'All'} | Budget: ₹{search_plan.constraints.budget.max or 'Any'}"
        try:
            await history_service.add_search_history(query, len(unified_products), plan_summary)
        except Exception as e:
            logger.warning(f"Failed to record search history: {e}")

        warnings: List[str] = []
        if ai_status == "unavailable":
            warnings.append("ScaleMax AI is unconfigured. Fast factual ranking and scoring applied.")
        elif ai_status == "degraded":
            if timings.get("ai_ranking_status") == "timed_out":
                warnings.append(f"AI ranking exceeded {self.ai_ranking_deadline_seconds:.1f}s budget; fast factual scoring applied.")
            else:
                warnings.append("AI ranking was temporarily unavailable; fast factual scoring applied.")

        success_retailers = [r for r, st in retailer_status.items() if st == "success"]
        blocked_retailers = [r for r, st in retailer_status.items() if st == "blocked"]

        for r_name, r_stat in retailer_status.items():
            if r_stat == "blocked":
                warnings.append(f"{r_name} requested a human verification challenge and returned no products at this time.")
            elif r_stat in ("no_results", "empty"):
                warnings.append(f"{r_name} returned no listings matching your search.")
            elif r_stat == "parse_error":
                warnings.append(f"Could not parse product listings from {r_name}.")
            elif r_stat == "timeout":
                warnings.append(f"{r_name} timed out after {self.retailer_deadline_seconds:.1f}s.")
            elif r_stat == "unavailable" or r_stat.startswith("error"):
                warnings.append(f"{r_name} was temporarily unreachable.")

        if not unified_products:
            if len(blocked_retailers) == len(retailer_status) and retailer_status:
                warnings.append("Requested retailers required browser verification challenges. Live listings could not be retrieved at this time.")
            elif not success_retailers:
                warnings.append("No usable products could be retrieved from requested retailers at this time.")
            else:
                warnings.append("Retailers responded but no products matched your specific search filters.")

        total_ms = int((time.perf_counter() - t_start) * 1000)
        timings["total_duration_ms"] = total_ms
        timings["diagnostics"] = {
            "search_id": search_id,
            "raw_extracted_count": len(raw_items_collected),
            "normalized_count": len(normalized_products),
            "deduplicated_count": len(canonical_products),
            "valid_filtered_count": len(valid_products),
            "excluded_count": len(excluded_list),
            "submitted_for_ranking_count": submitted_count,
            "ranked_count": len(ranked_products_map),
            "returned_count": len(unified_products),
            "ai_status": ai_status,
        }

        logger.info(
            f"[{search_id}] query='{query}' | retailers={retailer_status} "
            f"| raw={len(raw_items_collected)} norm={len(normalized_products)} dedup={len(canonical_products)} "
            f"valid={len(valid_products)} returned={len(unified_products)} "
            f"| ai={ai_status} | total={total_ms}ms"
        )

        response = AppSearchResponse(
            query=query,
            search_plan=search_plan,
            products=unified_products,
            excluded=excluded_list,
            counts=counts,
            ai_status=ai_status,  # type: ignore[arg-type]
            ai_meta=ai_meta,
            retailer_status=retailer_status,
            overall_summary=ai_summary,
            warnings=warnings,
            timings=timings,
        )

        # Cache non-empty valid responses
        if unified_products:
            search_cache.set(cache_key, response)

        return response


search_service = SearchService()
