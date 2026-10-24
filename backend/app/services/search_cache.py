from collections import OrderedDict
from datetime import datetime, timezone
import hashlib
import logging
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger("shopsmart.cache")


class SearchCache:
    """
    In-memory bounded LRU cache with TTL expiration, query key normalization,
    and freshness metadata tracking.
    """

    def __init__(self, max_entries: int = 150, default_ttl_seconds: float = 300.0):
        self.max_entries = max_entries
        self.default_ttl_seconds = default_ttl_seconds
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._in_flight: Dict[str, Any] = {}

    @staticmethod
    def normalize_key(
        query: str,
        sources: Optional[List[str]] = None,
        max_results: int = 10,
        budget_max: Optional[float] = None,
        sort_by: Optional[str] = None,
    ) -> str:
        """Create a deterministic, canonical cache key."""
        clean_q = " ".join(query.strip().lower().split())
        clean_sources = sorted([s.strip().lower() for s in (sources or ["amazon.in", "flipkart.com"])])
        b_max = f"{round(budget_max, 2)}" if budget_max else "none"
        s_by = (sort_by or "relevance").lower()

        raw_str = f"q:{clean_q}|s:{','.join(clean_sources)}|mr:{max_results}|b:{b_max}|sort:{s_by}"
        return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve entry if it exists and has not expired.
        Returns a copy with freshness metadata attached.
        """
        if key not in self._cache:
            return None

        entry = self._cache[key]
        now = time.time()
        age = now - entry["timestamp"]

        if age > entry["ttl"]:
            # Expired
            self._cache.pop(key, None)
            return None

        # Move to most recently used
        self._cache.move_to_end(key)
        
        cached_data = entry["data"]
        cached_at_iso = datetime.fromtimestamp(entry["timestamp"], tz=timezone.utc).isoformat()
        
        return {
            "data": cached_data,
            "cache_age_seconds": round(age, 1),
            "cached_at": cached_at_iso,
            "is_cached": True,
        }

    def set(self, key: str, data: Any, ttl: Optional[float] = None) -> None:
        """Store item in cache if valid. Evicts least recently used if at capacity."""
        if not data:
            return

        effective_ttl = ttl if ttl is not None else self.default_ttl_seconds

        # Evict oldest entry if full
        if len(self._cache) >= self.max_entries and key not in self._cache:
            self._cache.popitem(last=False)

        self._cache[key] = {
            "data": data,
            "timestamp": time.time(),
            "ttl": effective_ttl,
        }
        self._cache.move_to_end(key)

    def clear(self) -> None:
        """Explicitly invalidate the entire cache."""
        self._cache.clear()
        logger.info("Search cache cleared.")

    @property
    def size(self) -> int:
        return len(self._cache)


search_cache = SearchCache()
