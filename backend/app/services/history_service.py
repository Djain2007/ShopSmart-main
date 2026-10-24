import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiosqlite

from backend.app.config import settings

logger = logging.getLogger("shopsmart.history")


class HistoryService:
    """Manages SQLite persistence for search history and saved products."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.sqlite_db_path
        self._initialized = False

    async def _ensure_initialized(self) -> None:
        if not self._initialized:
            await self.init_db()

    async def init_db(self) -> None:
        """Create tables if they do not exist."""
        # Ensure parent directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS search_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT NOT NULL,
                    results_count INTEGER NOT NULL DEFAULT 0,
                    plan_summary TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS saved_products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    price REAL,
                    image_url TEXT,
                    url TEXT NOT NULL,
                    source TEXT NOT NULL,
                    rating REAL,
                    raw_json TEXT NOT NULL,
                    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.commit()
            self._initialized = True
            logger.info(f"Initialized SQLite database at {self.db_path}")

    async def add_search_history(self, query: str, results_count: int, plan_summary: Optional[str] = None) -> int:
        """Record a search query in history."""
        await self._ensure_initialized()
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    "INSERT INTO search_history (query, results_count, plan_summary) VALUES (?, ?, ?)",
                    (query.strip(), results_count, plan_summary),
                )
                await db.commit()
                return cursor.lastrowid or 0
        except Exception as e:
            logger.error(f"Failed to record search history: {e}")
            return 0

    async def get_search_history(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Retrieve recent searches."""
        await self._ensure_initialized()
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    "SELECT id, query, results_count, plan_summary, created_at FROM search_history ORDER BY id DESC LIMIT ?",
                    (limit,),
                ) as cursor:
                    rows = await cursor.fetchall()
                    return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Failed to retrieve search history: {e}")
            return []

    async def clear_search_history(self) -> bool:
        """Clear all search history."""
        await self._ensure_initialized()
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("DELETE FROM search_history")
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to clear search history: {e}")
            return False

    async def save_product(self, product_data: Dict[str, Any]) -> bool:
        """Save a product to favorites."""
        await self._ensure_initialized()
        pid = product_data.get("id")
        if not pid:
            return False
        title = product_data.get("title", "Untitled")
        price = product_data.get("price")
        if isinstance(price, dict):
            price = price.get("amount")
        image_url = product_data.get("image_url")
        url = product_data.get("url", "")
        source = product_data.get("source", "unknown")
        rating = product_data.get("rating")
        raw_json = json.dumps(product_data, default=str)

        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT INTO saved_products (product_id, title, price, image_url, url, source, rating, raw_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(product_id) DO UPDATE SET
                        title=excluded.title,
                        price=excluded.price,
                        image_url=excluded.image_url,
                        url=excluded.url,
                        rating=excluded.rating,
                        raw_json=excluded.raw_json,
                        saved_at=CURRENT_TIMESTAMP
                """, (pid, title, price, image_url, url, source, rating, raw_json))
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to save product {pid}: {e}")
            return False

    async def remove_saved_product(self, product_id: str) -> bool:
        """Remove a product from favorites."""
        await self._ensure_initialized()
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("DELETE FROM saved_products WHERE product_id = ?", (product_id,))
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to remove saved product {product_id}: {e}")
            return False

    async def get_saved_products(self) -> List[Dict[str, Any]]:
        """Retrieve all saved products."""
        await self._ensure_initialized()
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    "SELECT id, product_id, title, price, image_url, url, source, rating, raw_json, saved_at FROM saved_products ORDER BY id DESC"
                ) as cursor:
                    rows = await cursor.fetchall()
                    results = []
                    for r in rows:
                        item = dict(r)
                        try:
                            item["product_details"] = json.loads(item["raw_json"])
                        except Exception:
                            item["product_details"] = {}
                        results.append(item)
                    return results
        except Exception as e:
            logger.error(f"Failed to get saved products: {e}")
            return []

    async def get_saved_product_ids(self) -> set:
        """Return a set of all saved product IDs for fast O(1) lookup."""
        await self._ensure_initialized()
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute("SELECT product_id FROM saved_products") as cursor:
                    rows = await cursor.fetchall()
                    return {r[0] for r in rows}
        except Exception as e:
            logger.error(f"Failed to get saved product IDs: {e}")
            return set()


history_service = HistoryService()
