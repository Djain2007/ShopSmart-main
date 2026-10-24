from datetime import datetime
import math
import re
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator
from typing_extensions import Annotated

SourceName = Literal["amazon.in", "flipkart.com"]
SortPreference = Literal["relevance", "price_asc", "price_desc", "rating_desc", "review_count_desc"]
ALLOWED_SOURCES = ("amazon.in", "flipkart.com")

LIMITS = {
    "query_max_chars": 500,
    "chat_message_max_chars": 1000,
    "chat_history_max_turns": 10,
    "chat_turn_max_chars": 2000,
    "max_results_per_source_max": 30,
    "rank_products_max": 60,
    "compare_products_min": 2,
    "compare_products_max": 6,
    "chat_products_max": 60,
    "top_k_max": 20,
    "product_id_max_chars": 128,
    "product_title_max_chars": 500,
    "product_url_max_chars": 2048,
    "attributes_max": 60,
    "attribute_key_max_chars": 80,
    "attribute_value_max_chars": 300,
    "feature_evidence_max": 30,
    "feature_evidence_text_max_chars": 500,
    "list_items_max": 10,
    "list_item_max_chars": 80,
    "search_queries_max": 5,
    "compare_criteria_max": 10,
}

ShortStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=LIMITS["list_item_max_chars"])]
ShortList = Annotated[List[ShortStr], Field(max_length=LIMITS["list_items_max"])]
ProductId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=LIMITS["product_id_max_chars"], pattern=r"^[A-Za-z0-9._:\-]+$")]
CurrencyCode = Annotated[str, StringConstraints(pattern=r"^[A-Z]{3}$")]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


def _http_url(v: Optional[str], what: str) -> Optional[str]:
    if v is None:
        return None
    if len(v) > LIMITS["product_url_max_chars"]:
        raise ValueError(f"{what} too long")
    if not re.match(r"^https?://[^\s/$.?#].[^\s]*$", v, re.I) and not re.match(r"^https?://[a-zA-Z0-9.-]+", v, re.I):
        raise ValueError(f"{what} must be an absolute http(s) URL")
    return v


# ---------------------------------------------------------------- search plan ------------------------------
class Budget(Strict):
    min: Optional[float] = Field(None, ge=0, le=1e9, description="null = no minimum was stated")
    max: Optional[float] = Field(None, ge=0, le=1e9, description="null = no maximum was stated")
    currency: CurrencyCode = "INR"

    @model_validator(mode="after")
    def _order(self) -> "Budget":
        if self.min is not None and self.max is not None and self.min > self.max:
            raise ValueError("budget.min must be <= budget.max")
        return self


class Constraints(Strict):
    budget: Budget = Field(default_factory=Budget)
    preferred_brands: ShortList = Field(default_factory=list)
    excluded_brands: ShortList = Field(default_factory=list)
    required_features: ShortList = Field(default_factory=list)
    preferred_features: ShortList = Field(default_factory=list)
    excluded_features: ShortList = Field(default_factory=list)


class Clarification(Strict):
    question: str = Field(..., min_length=1, max_length=300)
    missing: List[ShortStr] = Field(default_factory=list, max_length=10)
    blocking: bool = Field(False, description="true = a search cannot sensibly be run until the user answers")


class SearchPlan(Strict):
    schema_version: Literal["1.0"] = "1.0"
    original_query: str = Field(..., min_length=1, max_length=LIMITS["query_max_chars"])
    category: Optional[str] = Field(None, max_length=80)
    intended_use: Optional[str] = Field(None, max_length=120)
    constraints: Constraints = Field(default_factory=Constraints)
    search_terms: ShortList = Field(default_factory=list)
    search_queries: Annotated[List[Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]], Field(max_length=LIMITS["search_queries_max"])] = Field(default_factory=list)
    sources: List[SourceName] = Field(default_factory=lambda: list(ALLOWED_SOURCES), min_length=1, max_length=2)
    max_results_per_source: int = Field(10, ge=1, le=LIMITS["max_results_per_source_max"])
    comparison_criteria: Annotated[List[ShortStr], Field(max_length=LIMITS["compare_criteria_max"])] = Field(default_factory=list)
    sort_preference: Optional[SortPreference] = None
    clarification: Optional[Clarification] = None
    warnings: Annotated[List[str], Field(max_length=20)] = Field(default_factory=list)

    @field_validator("sources")
    @classmethod
    def _unique_sources(cls, v: List[str]) -> List[str]:
        if len(set(v)) != len(v):
            raise ValueError("sources must be unique")
        return v


class InterpretRequest(Strict):
    query: str = Field(..., min_length=1, max_length=LIMITS["query_max_chars"])
    currency: CurrencyCode = "INR"
    sources: List[SourceName] = Field(default_factory=lambda: list(ALLOWED_SOURCES), min_length=1, max_length=2)
    max_results_per_source: int = Field(10, ge=1, le=LIMITS["max_results_per_source_max"])

    @field_validator("query")
    @classmethod
    def _query_not_blank(cls, v: str) -> str:
        if not re.search(r"\w", v):
            raise ValueError("query must contain letters or digits")
        return v

    @field_validator("sources")
    @classmethod
    def _unique_sources(cls, v: List[str]) -> List[str]:
        if len(set(v)) != len(v):
            raise ValueError("sources must be unique")
        return v


class Meta(Strict):
    schema_version: Literal["1.0"] = "1.0"
    backend: str = Field(..., description="'transformers' or 'mock'")
    model: str
    device_type: str
    latency_ms: int = Field(..., ge=0)
    llm_used: bool = Field(..., description="false when only deterministic logic produced the result")
    degraded: bool = Field(False, description="true when the LLM was expected but failed / returned invalid output")


class InterpretResponse(Strict):
    request_id: str
    search_plan: SearchPlan
    meta: Meta


# ---------------------------------------------------------------- product evidence -------------------------
class Money(Strict):
    amount: float = Field(..., ge=0, le=1e9)
    currency: CurrencyCode = "INR"


class EvidenceSnippet(Strict):
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=LIMITS["feature_evidence_text_max_chars"])]
    field: Literal["title", "bullet_points", "description", "specification", "review_summary"]


class Provenance(Strict):
    method: Literal["scraper", "synthetic", "cache"] = "scraper"
    completeness: Optional[float] = Field(None, ge=0, le=1)
    missing_fields: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    synthetic: bool = False


class Product(Strict):
    id: ProductId
    title: str = Field(..., min_length=1, max_length=LIMITS["product_title_max_chars"])
    brand: Optional[str] = Field(None, max_length=80)
    price: Optional[Money] = Field(None, description="null = price unavailable")
    list_price: Optional[Money] = Field(None, description="MRP / strike-through price, null if unknown")
    rating: Optional[float] = Field(None, ge=0, le=5, description="null = unavailable (NOT 0)")
    review_count: Optional[int] = Field(None, ge=0, le=1_000_000_000, description="null = unavailable (NOT 0)")
    image_url: Optional[str] = Field(None, description="null = no image")
    url: str = Field(..., description="original product page URL (never generated by the AI service)")
    source: SourceName
    attributes: Dict[str, Optional[Union[str, int, float, bool]]] = Field(default_factory=dict)
    feature_evidence: Annotated[List[EvidenceSnippet], Field(max_length=LIMITS["feature_evidence_max"])] = Field(default_factory=list)
    retrieved_at: datetime
    provenance: Provenance = Field(default_factory=Provenance)

    @field_validator("url")
    @classmethod
    def _url(cls, v: str) -> str:
        return _http_url(v, "url")  # type: ignore[return-value]

    @field_validator("image_url")
    @classmethod
    def _img(cls, v: Optional[str]) -> Optional[str]:
        return _http_url(v, "image_url")

    @field_validator("attributes")
    @classmethod
    def _attrs(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if len(v) > LIMITS["attributes_max"]:
            raise ValueError(f"at most {LIMITS['attributes_max']} attributes")
        for k, val in v.items():
            if not k or len(k) > LIMITS["attribute_key_max_chars"]:
                raise ValueError("attribute key must be 1-80 characters")
            if isinstance(val, str) and len(val) > LIMITS["attribute_value_max_chars"]:
                raise ValueError(f"attribute '{k[:30]}' value longer than {LIMITS['attribute_value_max_chars']} characters")
            if isinstance(val, float) and not math.isfinite(val):
                raise ValueError("attribute numbers must be finite")
        return v


def _unique_ids(products: List[Product]) -> None:
    ids = [p.id for p in products]
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        raise ValueError(f"duplicate product ids: {dup[:5]}")


# ---------------------------------------------------------------- rank --------------------------------------
class RankRequest(Strict):
    search_plan: SearchPlan
    products: List[Product] = Field(..., min_length=1, max_length=LIMITS["rank_products_max"])
    top_k: int = Field(10, ge=1, le=LIMITS["top_k_max"])
    include_explanations: bool = True

    @model_validator(mode="after")
    def _ids(self) -> "RankRequest":
        _unique_ids(self.products)
        return self


ScoreKey = Literal["budget", "required_features", "preferred_features", "relevance", "brand", "rating", "value", "data_quality"]


class ScoreComponent(Strict):
    applicable: bool
    score: Optional[float] = Field(None, ge=0, le=1, description="0..1, null when not applicable")
    weight: float = Field(..., ge=0, le=1, description="effective normalised weight among applicable components")
    contribution: float = Field(..., ge=0, le=100, description="points contributed to the 0..100 score")
    source: Optional[str] = None
    note: Optional[str] = None


class ScoreBreakdown(Strict):
    budget: ScoreComponent
    required_features: ScoreComponent
    preferred_features: ScoreComponent
    relevance: ScoreComponent
    brand: ScoreComponent
    rating: ScoreComponent
    value: ScoreComponent
    data_quality: ScoreComponent


class Explanation(Strict):
    summary: str = Field(..., min_length=1, max_length=400)
    pros: Annotated[List[Annotated[str, StringConstraints(max_length=200)]], Field(max_length=4)] = Field(default_factory=list)
    cons: Annotated[List[Annotated[str, StringConstraints(max_length=200)]], Field(max_length=4)] = Field(default_factory=list)
    unverified: Annotated[List[Annotated[str, StringConstraints(max_length=120)]], Field(max_length=8)] = Field(default_factory=list)
    source: Literal["llm", "deterministic"]


class RankedProduct(Strict):
    rank: int = Field(..., ge=1)
    product_id: str
    score: float = Field(..., ge=0, le=100)
    confidence: Literal["high", "medium", "low"]
    matched_features: List[str] = Field(default_factory=list)
    unverified_features: List[str] = Field(default_factory=list)
    flags: List[str] = Field(default_factory=list)
    score_breakdown: ScoreBreakdown
    explanation: Optional[Explanation] = Field(None)


ExclusionReason = Literal["over_budget", "under_min_budget", "excluded_brand", "excluded_feature_present"]


class ExcludedProduct(Strict):
    product_id: str
    reasons: List[ExclusionReason]
    detail: List[str] = Field(default_factory=list)


class Counts(Strict):
    received: int
    excluded: int
    ranked: int
    returned: int


class RankResponse(Strict):
    request_id: str
    ranked: List[RankedProduct]
    excluded: List[ExcludedProduct]
    counts: Counts
    overall_summary: Optional[str] = Field(None, max_length=600)
    insufficient_evidence: bool
    notes: List[str] = Field(default_factory=list)
    meta: Meta


# ---------------------------------------------------------------- compare -----------------------------------
class CompareRequest(Strict):
    search_plan: SearchPlan
    products: List[Product] = Field(..., min_length=LIMITS["compare_products_min"], max_length=LIMITS["compare_products_max"])
    criteria: Annotated[List[ShortStr], Field(max_length=LIMITS["compare_criteria_max"])] = Field(default_factory=list)

    @model_validator(mode="after")
    def _ids(self) -> "CompareRequest":
        _unique_ids(self.products)
        return self


class ComparisonCell(Strict):
    product_id: str
    value: Optional[str] = Field(None, description="display string, null = not available")
    numeric_value: Optional[float] = None
    verified: bool = Field(..., description="true only when value was in evidence")


class ComparisonRow(Strict):
    criterion: str
    kind: Literal["price", "rating", "review_count", "brand", "attribute"]
    cells: List[ComparisonCell]
    best_product_id: Optional[str] = None
    note: Optional[str] = None


class ProductInsight(Strict):
    product_id: str
    strengths: Annotated[List[Annotated[str, StringConstraints(max_length=200)]], Field(max_length=4)] = Field(default_factory=list)
    weaknesses: Annotated[List[Annotated[str, StringConstraints(max_length=200)]], Field(max_length=4)] = Field(default_factory=list)
    best_for: Optional[str] = Field(None, max_length=200)
    unverified: Annotated[List[Annotated[str, StringConstraints(max_length=120)]], Field(max_length=8)] = Field(default_factory=list)
    source: Literal["llm", "deterministic"]


class CompareResponse(Strict):
    request_id: str
    rows: List[ComparisonRow]
    product_insights: List[ProductInsight]
    verdict: Optional[str] = Field(None, max_length=600)
    notes: List[str] = Field(default_factory=list)
    meta: Meta


# ---------------------------------------------------------------- chat --------------------------------------
class ChatTurn(Strict):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=LIMITS["chat_turn_max_chars"])


class ChatRequest(Strict):
    search_plan: SearchPlan
    products: List[Product] = Field(..., min_length=1, max_length=LIMITS["chat_products_max"])
    ranked: Optional[List[RankedProduct]] = Field(None)
    message: str = Field(..., min_length=1, max_length=LIMITS["chat_message_max_chars"])
    history: Annotated[List[ChatTurn], Field(max_length=LIMITS["chat_history_max_turns"])] = Field(default_factory=list)

    @model_validator(mode="after")
    def _ids(self) -> "ChatRequest":
        _unique_ids(self.products)
        if self.ranked:
            known = {p.id for p in self.products}
            bad = [r.product_id for r in self.ranked if r.product_id not in known]
            if bad:
                raise ValueError(f"ranked[] references unknown product ids: {bad[:5]}")
        return self


class ChatResponse(Strict):
    request_id: str
    answer: str = Field(..., min_length=1, max_length=1500)
    referenced_product_ids: List[str] = Field(default_factory=list)
    unverified: List[str] = Field(default_factory=list)
    suggested_followups: Annotated[List[Annotated[str, StringConstraints(max_length=160)]], Field(max_length=3)] = Field(default_factory=list)
    answer_source: Literal["llm", "deterministic"]
    meta: Meta


# ---------------------------------------------------------------- health / errors ---------------------------
class HealthResponse(Strict):
    status: Literal["ok"]
    service: str
    version: str
    schema_version: str
    model: Dict[str, Any]
    device: Dict[str, Any]
    capabilities: List[str]
    uptime_s: int


class ReadyResponse(Strict):
    ready: bool
    reason: Optional[str] = None
    model: Optional[str] = None
    device_type: Optional[str] = None


class ErrorBody(Strict):
    code: str
    message: str
    details: Optional[List[Dict[str, Any]]] = None
    request_id: str


class ErrorResponse(Strict):
    error: ErrorBody


# ---------------------------------------------------------------- Local App Models --------------------------
class UnifiedProduct(BaseModel):
    """Merged product model presented to the frontend."""
    id: str
    title: str
    brand: Optional[str] = None
    price: Optional[float] = None
    list_price: Optional[float] = None
    currency: str = "INR"
    rating: Optional[float] = None
    review_count: Optional[int] = None
    image_url: Optional[str] = None
    url: str
    source: SourceName
    attributes: Dict[str, Any] = Field(default_factory=dict)
    bullet_points: List[str] = Field(default_factory=list)
    retrieved_at: str
    
    # Ranking data (joined from RankResponse if available)
    rank: Optional[int] = None
    score: Optional[float] = None
    confidence: Optional[Literal["high", "medium", "low"]] = None
    matched_features: List[str] = Field(default_factory=list)
    unverified_features: List[str] = Field(default_factory=list)
    flags: List[str] = Field(default_factory=list)
    explanation: Optional[Explanation] = None
    score_breakdown: Optional[ScoreBreakdown] = None
    
    # User interaction
    is_saved: bool = False


class AppSearchRequest(BaseModel):
    query: str
    sources: List[SourceName] = ["amazon.in", "flipkart.com"]
    max_results_per_source: int = 10
    budget_max: Optional[float] = None
    sort_by: Optional[SortPreference] = None


class AppSearchResponse(BaseModel):
    query: str
    search_plan: SearchPlan
    products: List[UnifiedProduct]
    excluded: List[ExcludedProduct] = Field(default_factory=list)
    counts: Counts
    ai_status: Literal["connected", "ready", "degraded", "unavailable"]
    ai_meta: Optional[Meta] = None
    retailer_status: Dict[str, str] = Field(default_factory=dict)
    overall_summary: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    timings: Optional[Dict[str, Any]] = None


class AppCompareRequest(BaseModel):
    product_ids: List[str]
    criteria: Optional[List[str]] = None


class AppCompareResponse(BaseModel):
    rows: List[ComparisonRow]
    product_insights: List[ProductInsight]
    verdict: Optional[str] = None
    ai_status: Literal["connected", "ready", "degraded", "unavailable"]
    meta: Optional[Meta] = None


class AppChatRequest(BaseModel):
    message: str
    history: List[ChatTurn] = Field(default_factory=list)
    product_ids: Optional[List[str]] = None


class AIConfigUpdateRequest(BaseModel):
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
