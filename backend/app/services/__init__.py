from backend.app.services.product_normalizer import normalize_raw_product, deduplicate_products
from backend.app.services.scalemax_client import scalemax_client, ScaleMaxClient
from backend.app.services.ai_service import ai_service, AIService
from backend.app.services.history_service import history_service, HistoryService
from backend.app.services.search_service import search_service, SearchService
from backend.app.services.comparison_service import comparison_service, ComparisonService
from backend.app.services.search_cache import search_cache, SearchCache

__all__ = [
    "normalize_raw_product",
    "deduplicate_products",
    "scalemax_client",
    "ScaleMaxClient",
    "ai_service",
    "AIService",
    "history_service",
    "HistoryService",
    "search_service",
    "SearchService",
    "comparison_service",
    "ComparisonService",
    "search_cache",
    "SearchCache",
]
