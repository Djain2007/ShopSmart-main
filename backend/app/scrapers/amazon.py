from datetime import datetime, timezone
import re
from typing import Any, Dict, List
from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup

from backend.app.scrapers.base import BaseScraper, BotChallengeError


class AmazonScraper(BaseScraper):
    """Adapter for discovering products from Amazon.in public search."""

    def __init__(self):
        super().__init__(source_name="amazon.in", timeout_seconds=10.0)

    def build_search_url(self, query: str) -> str:
        return f"https://www.amazon.in/s?k={quote_plus(query)}"

    def parse_search_page(self, html: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        products: List[Dict[str, Any]] = []

        # Bot challenge check
        title_tag = soup.find("title")
        title_text = title_tag.get_text(strip=True).lower() if title_tag else ""
        if "robot check" in title_text or "access denied" in title_text:
            raise BotChallengeError("Amazon Robot Check challenge detected")
        if "type the characters you see in this image" in html.lower():
            raise BotChallengeError("Amazon CAPTCHA challenge detected")

        # Find search result items with an ASIN
        cards = soup.select('div[data-asin]:not([data-asin=""])')
        if not cards:
            cards = [c for c in soup.find_all("div") if c.get("data-asin") and len(c.get("data-asin", "").strip()) >= 8]

        for card in cards:
            asin = (card.get("data-asin") or "").strip()
            if not asin or len(asin) < 8:
                continue

            # Brand
            brand = None
            brand_el = card.select_one("h5.s-line-clamp-1, span.a-size-medium.a-color-base, span.s-line-clamp-1")
            if brand_el:
                brand = brand_el.get_text(strip=True) or None

            # Title
            title_el = card.select_one("h2 a span, h2 span, h2 a, span.a-text-normal")
            title = title_el.get_text(strip=True) if title_el else None
            if not title:
                # Skip sponsored banners or non-product cards
                continue

            # Link
            link_el = card.select_one("h2 a") or card.select_one("a.a-link-normal.s-no-outline") or card.select_one("a.a-link-normal[href*='/dp/']")

            rel_url = link_el.get("href") if link_el else None
            if not rel_url:
                continue
            full_url = urljoin("https://www.amazon.in", rel_url)

            # Price
            price = None
            price_offscreen = card.select_one("span.a-price:not(.a-text-price) span.a-offscreen")
            if price_offscreen:
                price = price_offscreen.get_text(strip=True)
            else:
                price_whole = card.select_one("span.a-price-whole")
                if price_whole:
                    price = price_whole.get_text(strip=True)

            # List price / strike-through
            list_price = None
            list_price_el = card.select_one("span.a-price.a-text-price span.a-offscreen")
            if list_price_el:
                list_price = list_price_el.get_text(strip=True)

            # Rating
            rating = None
            rating_el = card.select_one("i.a-icon-star-small span, span.a-icon-alt, i.a-icon-star span")
            if rating_el:
                r_text = rating_el.get_text(strip=True)
                m = re.search(r"(\d+(?:\.\d+)?)", r_text)
                if m:
                    try:
                        rating = float(m.group(1))
                    except ValueError:
                        rating = None

            # Review count
            review_count = None
            review_el = card.select_one("span.a-size-base.s-underline-text, a span.a-size-base")
            if review_el:
                rev_text = review_el.get_text(strip=True)
                m = re.search(r"[\d,]+", rev_text)
                if m:
                    try:
                        review_count = int(m.group(0).replace(",", ""))
                    except ValueError:
                        review_count = None

            # Image
            img_el = card.select_one("img.s-image")
            img_url = img_el.get("src") if img_el else None

            # Features / bullets if present in search snippet
            bullets: List[str] = []
            snippet_els = card.select("div.a-row.a-size-base span, ul.a-unordered-list li")
            for s_el in snippet_els[:5]:
                st = s_el.get_text(strip=True)
                if st and len(st) > 8 and not any(k in st.lower() for k in ("sponsored", "delivery", "prime", "get it")):
                    bullets.append(st)

            products.append({
                "id": asin,
                "asin": asin,
                "title": title,
                "brand": brand,
                "price": price,
                "list_price": list_price,
                "rating": rating,
                "review_count": review_count,
                "image_url": img_url,
                "url": full_url,
                "source": "amazon.in",
                "bullets": bullets,
                "retrieved_at": datetime.now(timezone.utc),
            })

        return products
