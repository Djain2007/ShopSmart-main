from abc import ABC, abstractmethod
import asyncio
import logging
from typing import Any, Dict, List, Optional
import httpx

from backend.app.config import settings
from backend.app.models.schemas import SourceName

logger = logging.getLogger("shopsmart.scrapers")


class BotChallengeError(Exception):
    """Raised when an upstream retailer returns a bot challenge / captcha page."""
    pass


class BaseScraper(ABC):
    """Abstract base scraper for Indian e-commerce discovery with bounded timeouts and connection pooling."""

    def __init__(self, source_name: SourceName, timeout_seconds: Optional[float] = None):
        self.source_name: SourceName = source_name
        self.timeout_seconds: float = timeout_seconds if timeout_seconds is not None else getattr(settings, "retailer_timeout", 7.5)
        self._shared_client: Optional[httpx.AsyncClient] = None

    @abstractmethod
    def build_search_url(self, query: str) -> str:
        """Construct the search URL for the retailer."""
        pass

    @abstractmethod
    def parse_search_page(self, html: str) -> List[Dict[str, Any]]:
        """Parse raw HTML search results into a list of raw product dictionaries."""
        pass

    def get_default_headers(self) -> Dict[str, str]:
        """Standard browser headers to request public web pages legitimately."""
        return {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
        }

    async def _get_client(self) -> httpx.AsyncClient:
        if self._shared_client is None or self._shared_client.is_closed:
            limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)
            self._shared_client = httpx.AsyncClient(
                headers=self.get_default_headers(),
                timeout=httpx.Timeout(self.timeout_seconds, connect=3.5, read=self.timeout_seconds),
                follow_redirects=True,
                limits=limits,
            )
        return self._shared_client

    async def close(self) -> None:
        """Clean up HTTP client session."""
        if self._shared_client and not self._shared_client.is_closed:
            await self._shared_client.aclose()
            self._shared_client = None

    async def search(self, query: str, max_results: int = 15) -> Dict[str, Any]:
        """
        Executes search on the retailer's public search page with fast failover.
        Returns a dict:
        {
            "source": str,
            "status": "success" | "no_results" | "blocked" | "unavailable" | "parse_error",
            "message": str,
            "products": List[Dict[str, Any]]
        }
        """
        url = self.build_search_url(query)

        try:
            client = await self._get_client()
            resp = await client.get(url)

            # Check for bot challenge immediately in HTTP response
            lowered_text = resp.text.lower()
            is_bot_check = (
                resp.status_code in (403, 503)
                or "robot check" in lowered_text
                or "automated access" in lowered_text
                or "api-services-support@amazon.com" in lowered_text
                or "verify you are human" in lowered_text
                or "enter the characters you see below" in lowered_text
                or "security challenge" in lowered_text
                or "<title>access denied" in lowered_text
                or ("humanchallengereducer" in lowered_text and "challenge_present" in lowered_text)
            )

            if is_bot_check:
                logger.warning(f"Retailer {self.source_name} anti-bot challenge (HTTP {resp.status_code})")
                return {
                    "source": self.source_name,
                    "status": "blocked",
                    "message": f"{self.source_name} requires a browser verification challenge at this time.",
                    "products": [],
                }

            if resp.status_code != 200:
                logger.warning(f"Retailer {self.source_name} returned non-200 HTTP status: {resp.status_code}")
                return {
                    "source": self.source_name,
                    "status": "unavailable",
                    "message": f"Retailer {self.source_name} returned HTTP {resp.status_code}.",
                    "products": [],
                }

            # Parse HTML off the event loop so Beautiful Soup doesn't block async execution
            try:
                raw_products = await asyncio.to_thread(self.parse_search_page, resp.text)
            except BotChallengeError as bce:
                logger.warning(f"Retailer {self.source_name} returned challenge page: {bce}")
                return {
                    "source": self.source_name,
                    "status": "blocked",
                    "message": f"{self.source_name} served a verification challenge page.",
                    "products": [],
                }
            except Exception as pe:
                logger.error(f"Error parsing {self.source_name} search page: {pe}", exc_info=True)
                return {
                    "source": self.source_name,
                    "status": "parse_error",
                    "message": f"Could not parse product listings from {self.source_name}.",
                    "products": [],
                }

            limited = raw_products[:max_results]

            if not limited:
                return {
                    "source": self.source_name,
                    "status": "no_results",
                    "message": f"No usable products extracted from {self.source_name}.",
                    "products": [],
                }

            return {
                "source": self.source_name,
                "status": "success",
                "message": f"Found {len(limited)} products from {self.source_name}.",
                "products": limited,
            }

        except (httpx.TimeoutException, asyncio.TimeoutError):
            logger.warning(f"Timeout while reaching {self.source_name} after {self.timeout_seconds}s")
            return {
                "source": self.source_name,
                "status": "timeout",
                "message": f"Connection to {self.source_name} timed out after {self.timeout_seconds}s.",
                "products": [],
            }
        except Exception as e:
            logger.error(f"Error scraping {self.source_name}: {type(e).__name__}: {e}")
            return {
                "source": self.source_name,
                "status": "unavailable",
                "message": f"Error reaching {self.source_name}: {str(e)}",
                "products": [],
            }

