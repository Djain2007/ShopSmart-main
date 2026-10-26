import json
import logging
import time
from typing import Any, Dict, List, Optional
import uuid

from backend.app.config import settings
from backend.app.models.schemas import (
    LIMITS,
    Budget,
    ChatTurn,
    Constraints,
    Counts,
    Explanation,
    HealthResponse,
    InterpretResponse,
    Meta,
    Product,
    RankResponse,
    RankedProduct,
    ReadyResponse,
    ScoreBreakdown,
    ScoreComponent,
    SearchPlan,
    SourceName,
)
from backend.app.services.scalemax_client import (
    ScaleMaxClient,
    scalemax_client,
)

logger = logging.getLogger("shopsmart.ai_service")


class AIService:
    """
    Centralized AI service coordinating natural language processing, product ranking,
    comparison analysis, and conversational shopping assistance via ScaleMax.
    """

    def __init__(self, client: Optional[ScaleMaxClient] = None):
        self.client: ScaleMaxClient = client or scalemax_client

    async def check_health(self) -> Optional[HealthResponse]:
        """Check status of ScaleMax service."""
        return await self.client.check_health()

    async def check_ready(self) -> Optional[ReadyResponse]:
        """Check readiness of ScaleMax configuration."""
        return await self.client.check_ready()

    async def interpret_query(
        self,
        query: str,
        sources: Optional[List[SourceName]] = None,
        max_results_per_source: int = 10,
    ) -> Optional[InterpretResponse]:
        """
        Interprets natural language shopping intent into a structured SearchPlan via ScaleMax.
        Extracts budget constraints, categories, brands, required features, and retailer search queries.
        """
        if not self.client.is_configured:
            return None

        t0 = time.perf_counter()
        clean_q = query.strip()[:LIMITS["query_max_chars"]]
        req_id = f"interp-{uuid.uuid4().hex[:12]}"

        prompt = f"""You are the query understanding engine for ShopSmart, an Indian e-commerce comparison shopping assistant.
Analyze this user shopping query: "{clean_q}"

Return a strictly valid JSON object matching this exact schema:
{{
  "category": "laptop | smartphone | audio | smartwatch | tablet | television | camera | monitor | other",
  "intended_use": "short string describing use case or null (e.g. coding, video editing, gaming)",
  "budget": {{
    "min": float or null,
    "max": float or null,
    "currency": "INR"
  }},
  "preferred_brands": ["brand1", "brand2"],
  "excluded_brands": ["brand3"],
  "required_features": ["feature1", "feature2"],
  "preferred_features": ["feature1"],
  "search_terms": ["2 to 5 essential keywords"],
  "search_queries": ["1 to 2 clean keyword search strings optimized for Amazon India and Flipkart search bars"],
  "comparison_criteria": ["3 to 5 key comparison criteria like Price, Rating, Battery, Processor"],
  "sort_preference": "relevance | price_asc | price_desc | rating_desc | review_count_desc"
}}

Rules:
1. Currency is INR. Convert 'k' to 1000, 'lakh' to 100000 (e.g. 50k = 50000, 1.5 lakh = 150000).
2. Clean search_queries of filler words (e.g. "find me", "under 50k") so they work directly in retailer search bars.
3. Output ONLY the JSON object. Do not wrap in extra prose.
"""

        messages = [
            {"role": "system", "content": "You are a precise JSON-generating shopping query parser."},
            {"role": "user", "content": prompt},
        ]

        try:
            raw_json = await self.client.complete_json(messages=messages, max_tokens=600, temperature=0.1, timeout=8.0)
            latency_ms = int((time.perf_counter() - t0) * 1000)

            # Build Constraints
            b_data = raw_json.get("budget", {})
            b_min = float(b_data["min"]) if b_data.get("min") is not None else None
            b_max = float(b_data["max"]) if b_data.get("max") is not None else None
            if b_min is not None and b_max is not None and b_min > b_max:
                b_min, b_max = b_max, b_min

            constraints = Constraints(
                budget=Budget(min=b_min, max=b_max, currency="INR"),
                preferred_brands=[str(b).strip() for b in raw_json.get("preferred_brands", []) if str(b).strip()][:LIMITS["list_items_max"]],
                excluded_brands=[str(b).strip() for b in raw_json.get("excluded_brands", []) if str(b).strip()][:LIMITS["list_items_max"]],
                required_features=[str(f).strip() for f in raw_json.get("required_features", []) if str(f).strip()][:LIMITS["list_items_max"]],
                preferred_features=[str(f).strip() for f in raw_json.get("preferred_features", []) if str(f).strip()][:LIMITS["list_items_max"]],
                excluded_features=[],
            )

            # Build search queries
            sqs = [str(q).strip() for q in raw_json.get("search_queries", []) if len(str(q).strip()) >= 2]
            if not sqs:
                sqs = [clean_q[:80]]

            # Sort preference
            sort_pref = raw_json.get("sort_preference")
            if sort_pref not in ("relevance", "price_asc", "price_desc", "rating_desc", "review_count_desc"):
                sort_pref = "relevance"

            plan = SearchPlan(
                schema_version="1.0",
                original_query=clean_q,
                category=raw_json.get("category"),
                intended_use=raw_json.get("intended_use"),
                constraints=constraints,
                search_terms=[str(t).strip() for t in raw_json.get("search_terms", [])][:6],
                search_queries=sqs[:LIMITS["search_queries_max"]],
                sources=sources or ["amazon.in", "flipkart.com"],
                max_results_per_source=max_results_per_source,
                comparison_criteria=[str(c).strip() for c in raw_json.get("comparison_criteria", [])][:LIMITS["compare_criteria_max"]],
                sort_preference=sort_pref,
                clarification=None,
                warnings=[],
            )

            meta = Meta(
                schema_version="1.0",
                backend="scalemax",
                model=self.client.model,
                device_type="cloud-api",
                latency_ms=latency_ms,
                llm_used=True,
                degraded=False,
            )

            return InterpretResponse(request_id=req_id, search_plan=plan, meta=meta)

        except Exception as e:
            logger.warning(f"ScaleMax query interpretation failed: {e}")
            return None

    async def rank_products(
        self,
        plan: SearchPlan,
        products: List[Product],
        top_k: int = 10,
        include_explanations: bool = True,
    ) -> Optional[RankResponse]:
        """
        Rank candidate products against the user's SearchPlan using ScaleMax.
        Generates grounded match scores (0-100), pros/cons based strictly on verified specs,
        and an overall summary.
        """
        if not self.client.is_configured or not products:
            return None

        t0 = time.perf_counter()
        req_id = f"rank-{uuid.uuid4().hex[:12]}"

        # Deduplicate & cap to top candidate items (max 3 to ensure fast reasoning response & prevent client timeouts)
        seen_ids = set()
        candidate_products: List[Product] = []
        for p in products:
            if p.id not in seen_ids:
                seen_ids.add(p.id)
                candidate_products.append(p)
            if len(candidate_products) >= min(top_k, 3):
                break

        # Prepare compact product summary payloads (DO NOT send bloated payloads to LLM)
        prod_summaries = []
        prod_map = {p.id: p for p in candidate_products}

        for p in candidate_products:
            price_str = f"₹{p.price.amount:g}" if p.price else "Unknown"
            rating_str = f"{p.rating}★ ({p.review_count or 0} reviews)" if p.rating else "No rating"
            bullets = [e.text for e in p.feature_evidence[:2]]
            prod_summaries.append({
                "id": p.id,
                "title": p.title[:80],
                "brand": p.brand or "Unknown",
                "price": price_str,
                "rating": rating_str,
                "source": p.source,
                "highlights": bullets,
            })

        prompt = (
            f"Query: \"{plan.original_query}\"\n"
            f"Candidates: {json.dumps(prod_summaries, separators=(',', ':'))}\n\n"
            "Evaluate candidates and return strictly valid JSON matching this schema:\n"
            "{\n"
            '  "overall_summary": "1 concise sentence overview of recommendations",\n'
            '  "ranked": [\n'
            '    {\n'
            '      "product_id": "exact id from candidates",\n'
            '      "score": 90.0,\n'
            '      "confidence": "high",\n'
            '      "summary": "1 concise sentence why this product fits",\n'
            '      "pros": ["1 verified pro"],\n'
            '      "cons": ["1 verified con"]\n'
            '    }\n'
            '  ]\n'
            "}\n"
            "CRITICAL: Reference only real candidate IDs. Output strictly JSON without markdown."
        )

        messages = [
            {"role": "system", "content": "You are a shopping ranking engine. Be extremely concise. Output strictly JSON without markdown."},
            {"role": "user", "content": prompt},
        ]

        try:
            ranking_timeout = getattr(settings, "scalemax_ranking_timeout", 10.0)
            raw_json, sm_timings = await self.client.complete_json_with_timings(
                messages=messages,
                max_tokens=600,
                temperature=0.1,
                timeout=ranking_timeout,
                correlation_id=req_id,
            )
            t_join_start = time.perf_counter()

            ranked_items: List[RankedProduct] = []
            returned_ranked = (
                raw_json.get("ranked")
                or raw_json.get("products")
                or (raw_json if isinstance(raw_json, list) else [])
            )

            assigned_rank = 1
            for r in returned_ranked:
                if not isinstance(r, dict):
                    continue
                raw_pid = r.get("product_id") or r.get("id") or r.get("productId")
                if not raw_pid:
                    continue
                pid_str = str(raw_pid).strip()
                if pid_str in prod_map:
                    matched_id = pid_str
                else:
                    matched_id = next((k for k in prod_map if k.endswith(f":{pid_str}") or k.split(":")[-1] == pid_str), None)
                if not matched_id:
                    continue

                pid = matched_id
                orig_p = prod_map[pid]
                score_val = max(0.0, min(100.0, float(r.get("score", 70.0))))
                conf = r.get("confidence")
                if conf not in ("high", "medium", "low"):
                    conf = "medium"

                # Support nested explanation or flat summary/pros/cons
                expl_data = r.get("explanation", {}) if isinstance(r.get("explanation"), dict) else {}
                summary_text = expl_data.get("summary") or r.get("summary") or f"Scored {score_val}/100"
                pros_list = expl_data.get("pros") or r.get("pros") or []
                cons_list = expl_data.get("cons") or r.get("cons") or []

                expl = Explanation(
                    summary=str(summary_text)[:160],
                    pros=[str(x)[:100] for x in pros_list][:3],
                    cons=[str(x)[:100] for x in cons_list][:3],
                    unverified=[str(x)[:100] for x in r.get("unverified_features", [])][:4],
                    source="llm",
                )

                # Construct simple breakdown
                breakdown = ScoreBreakdown(
                    budget=ScoreComponent(applicable=True, score=round(score_val / 100.0, 2), weight=0.2, contribution=round(score_val * 0.2, 1), source="llm", note=None),
                    required_features=ScoreComponent(applicable=bool(plan.constraints.required_features), score=0.9, weight=0.25, contribution=22.5, source="llm", note=None),
                    preferred_features=ScoreComponent(applicable=False, score=1.0, weight=0.05, contribution=5.0, source="llm", note=None),
                    relevance=ScoreComponent(applicable=True, score=0.9, weight=0.2, contribution=18.0, source="llm", note=None),
                    brand=ScoreComponent(applicable=bool(plan.constraints.preferred_brands), score=0.8, weight=0.1, contribution=8.0, source="llm", note=None),
                    rating=ScoreComponent(applicable=True, score=round((orig_p.rating or 3.5) / 5.0, 2), weight=0.1, contribution=8.0, source="llm", note=None),
                    value=ScoreComponent(applicable=True, score=0.8, weight=0.05, contribution=4.0, source="llm", note=None),
                    data_quality=ScoreComponent(applicable=True, score=0.9, weight=0.05, contribution=4.5, source="deterministic", note=None),
                )

                ranked_items.append(RankedProduct(
                    product_id=pid,
                    rank=assigned_rank,
                    score=score_val,
                    confidence=conf,
                    matched_features=[str(x)[:80] for x in r.get("matched_features", [])][:8],
                    unverified_features=[str(x)[:80] for x in r.get("unverified_features", [])][:8],
                    flags=[str(x)[:40] for x in r.get("flags", [])][:4],
                    score_breakdown=breakdown,
                    explanation=expl,
                ))
                assigned_rank += 1

            join_ms = int((time.perf_counter() - t_join_start) * 1000)
            latency_ms = int((time.perf_counter() - t0) * 1000)

            detailed_timings = {
                "correlation_id": req_id,
                "model_completion_ms": sm_timings.get("model_completion_ms", latency_ms),
                "ranking_response_parse_ms": sm_timings.get("response_parsing_ms", 0),
                "product_ranking_and_joining_ms": join_ms,
                "total_ai_latency_ms": latency_ms,
            }

            meta = Meta(
                schema_version="1.0",
                backend="scalemax",
                model=self.client.model,
                device_type="cloud-api",
                latency_ms=latency_ms,
                llm_used=True,
                degraded=False,
            )

            counts = Counts(
                received=len(candidate_products),
                excluded=0,
                ranked=len(ranked_items),
                returned=len(ranked_items),
            )

            # Store detailed timings in notes field for upstream extraction
            notes_payload = [json.dumps({"scalemax_detailed_timings": detailed_timings})]

            return RankResponse(
                request_id=req_id,
                ranked=ranked_items,
                excluded=[],
                counts=counts,
                overall_summary=raw_json.get("overall_summary"),
                insufficient_evidence=False,
                notes=notes_payload,
                meta=meta,
            )

        except Exception as e:
            logger.warning(f"ScaleMax product ranking failed: {e}")
            return None

    async def compare_products(
        self,
        products: List[Product],
        plan: SearchPlan,
        criteria: Optional[List[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Produce AI product insights and verdict for side-by-side product comparison via ScaleMax.
        """
        if not self.client.is_configured or len(products) < 2:
            return None

        t0 = time.perf_counter()
        comp_summaries = []
        for p in products[:6]:
            price_str = f"₹{p.price.amount:g}" if p.price else "Price unavailable"
            rating_str = f"{p.rating}★ ({p.review_count or 0} reviews)" if p.rating else "No rating"
            bullets = [e.text for e in p.feature_evidence[:4]]
            comp_summaries.append({
                "id": p.id,
                "title": p.title[:120],
                "brand": p.brand or "Unknown",
                "price": price_str,
                "rating": rating_str,
                "source": p.source,
                "attributes": p.attributes,
                "highlights": bullets,
            })

        crit_list = criteria or ["Price & Value", "Rating & Reliability", "Key Features & Build"]

        prompt = f"""Compare these {len(products)} products for an Indian e-commerce buyer:
Criteria: {', '.join(crit_list)}

Products:
{json.dumps(comp_summaries, indent=1)}

Return a valid JSON object matching this schema:
{{
  "verdict": "Clear, objective comparison summary (2-3 sentences) advising which product to choose for which need.",
  "insights": [
    {{
      "product_id": "exact id from products list",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "best_for": "Who should buy this item",
      "unverified": ["any spec not clearly verified"]
    }}
  ]
}}

Output ONLY the JSON object.
"""

        messages = [
            {"role": "system", "content": "You are an objective product comparison expert. Output only JSON."},
            {"role": "user", "content": prompt},
        ]

        try:
            raw_json = await self.client.complete_json(messages=messages, max_tokens=1000, temperature=0.1, timeout=8.0)
            latency_ms = int((time.perf_counter() - t0) * 1000)
            raw_json["latency_ms"] = latency_ms
            return raw_json
        except Exception as e:
            logger.warning(f"ScaleMax product comparison failed: {e}")
            return None

    async def chat(
        self,
        plan: SearchPlan,
        products: List[Product],
        message: str,
        history: Optional[List[ChatTurn]] = None,
        ranked: Optional[List[RankedProduct]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Answer user questions conversationally using ScaleMax, strictly grounded in the
        currently searched products.
        """
        if not self.client.is_configured or not products:
            return None

        t0 = time.perf_counter()
        active_products = products[:8]

        product_context = []
        for p in active_products:
            price_str = f"₹{p.price.amount:g}" if p.price else "Price unavailable"
            rating_str = f"{p.rating}★" if p.rating else "No rating"
            bullets = [e.text for e in p.feature_evidence[:3]]
            product_context.append({
                "id": p.id,
                "title": p.title[:100],
                "price": price_str,
                "rating": rating_str,
                "source": p.source,
                "specs": bullets,
            })

        system_prompt = f"""You are ShopSmart AI, a helpful Indian shopping assistant.
You answer user questions accurately based ONLY on the products currently loaded:
{json.dumps(product_context, indent=1)}

Rules:
1. Always base factual claims (price, rating, specs) strictly on the provided products.
2. If a feature or price is unknown, clearly state it is unverified.
3. Return a valid JSON object matching:
{{
  "answer": "Helpful, conversational answer using markdown for readability",
  "referenced_product_ids": ["ids of products mentioned in answer"],
  "unverified": ["any unverified specs discussed"],
  "suggested_followups": ["follow up question 1", "follow up question 2"]
}}
"""

        formatted_messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

        # Add recent conversation turns (max 6 turns)
        if history:
            for turn in history[-6:]:
                role = "user" if turn.role == "user" else "assistant"
                formatted_messages.append({"role": role, "content": turn.content[:1000]})

        formatted_messages.append({"role": "user", "content": message.strip()})

        try:
            raw_json = await self.client.complete_json(messages=formatted_messages, max_tokens=800, temperature=0.2, timeout=8.0)
            ref_ids = [pid for pid in raw_json.get("referenced_product_ids", []) if any(p.id == pid for p in active_products)]
            return {
                "answer": raw_json.get("answer", "I could not generate an answer grounded in the products."),
                "referenced_product_ids": ref_ids,
                "unverified": raw_json.get("unverified", []),
                "suggested_followups": raw_json.get("suggested_followups", [
                    "Compare top 2 products side by side",
                    "Which one has the highest rating?",
                    "What is the best budget option?",
                ])[:3],
                "answer_source": "llm",
            }
        except Exception as e:
            logger.warning(f"ScaleMax shopping chat failed: {e}")
            return None


ai_service = AIService()
