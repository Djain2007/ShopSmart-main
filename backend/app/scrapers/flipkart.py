from datetime import datetime, timezone
import json
import re
from typing import Any, Dict, List

from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup

from backend.app.scrapers.base import BaseScraper, BotChallengeError


class FlipkartScraper(BaseScraper):
    """Adapter for discovering products from Flipkart public search supporting both grid and list layouts."""

    def __init__(self):
        super().__init__(source_name="flipkart.com", timeout_seconds=10.0)

    def build_search_url(self, query: str) -> str:
        return f"https://www.flipkart.com/search?q={quote_plus(query)}"

    def parse_search_page(self, html: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        products: List[Dict[str, Any]] = []

        # 1. Verification / bot challenge page check
        title_tag = soup.find("title")
        title_text = title_tag.get_text(strip=True).lower() if title_tag else ""
        if any(k in title_text for k in ("access denied", "robot check", "security challenge")):
            raise BotChallengeError(f"Flipkart challenge page detected: {title_text}")
        if "enter the characters you see below" in html.lower() or ("humanchallengereducer" in html.lower() and "challenge_present" in html.lower()):
            raise BotChallengeError("Flipkart captcha challenge detected")

        # 2. Extract structured JSON-LD item list metadata if present as fallback
        json_ld_map: Dict[str, tuple[str, str]] = {}
        for script in soup.find_all("script", type="application/ld+json"):
            if not script.string:
                continue
            try:
                data = json.loads(script.string)
                items = data if isinstance(data, list) else [data]
                for it in items:
                    if it.get("@type") == "ItemList":
                        for elem in it.get("itemListElement", []):
                            name = elem.get("name")
                            url = elem.get("url")
                            if url and name:
                                m = re.search(r"[?&]pid=([A-Za-z0-9]+)", url)
                                if m:
                                    json_ld_map[m.group(1)] = (str(name).strip(), str(url).strip())
            except Exception:
                pass

        # 3. Find search result cards
        cards = soup.select("div[data-id]")
        if not cards:
            cards = soup.select("div._1AtVbE, div.cPHDOP, div._1YokD2 > div")

        for card in cards:
            pid = (card.get("data-id") or "").strip()

            # Link extraction across layouts
            link_el = card.select_one(
                'a[href*="/p/"], a.CIaYa1, a.k7wcnx, a._1fQZEK, a.s1Q9rs, a.atJtCj, a.WKTcLC, a[href*="pid="], a[href]'
            )
            rel_url = link_el.get("href") if link_el else None

            if not rel_url or ("/p/" not in rel_url and "pid=" not in rel_url):
                if pid and pid in json_ld_map:
                    full_url = json_ld_map[pid][1]
                else:
                    continue
            else:
                full_url = urljoin("https://www.flipkart.com", rel_url)

            # Extract pid from URL if not on card tag
            if not pid:
                m = re.search(r"[?&]pid=([A-Za-z0-9]+)", rel_url or full_url)
                if m:
                    pid = m.group(1)
            if not pid:
                continue

            # Brand extraction
            brand = None
            brand_el = card.select_one("div.Fo1I0b, div._2WkVRV, div.s4t9tK + div")
            if brand_el:
                brand = brand_el.get_text(strip=True) or None

            # Title extraction with multiple fallbacks (fashion grid, electronics list, link title, json-ld)
            title = None

            # Check title attribute on link elements
            for title_sel in ("a.atJtCj[title]", "a.WKTcLC[title]", "a[title]"):
                el = card.select_one(title_sel)
                if el and el.get("title") and len(el.get("title").strip()) > 3:
                    title = el.get("title").strip()
                    break

            if not title:
                # Check dedicated title text elements
                title_el = card.select_one(
                    "div.KzDlHZ, div._4rR01T, a.wjcEIp, a.s1Q9rs, a.atJtCj, a.WKTcLC"
                )
                if title_el:
                    title = title_el.get_text(strip=True)

            if not title:
                # Check image alt
                img_el = card.select_one("img.MZeksS, img.UCc1lI, img.DByuf4, img._396cs4, img")
                if img_el and img_el.get("alt"):
                    title = img_el.get("alt").strip()

            if not title and pid in json_ld_map:
                title = json_ld_map[pid][0]

            # Prepend brand if not already in title
            if brand and title and brand.lower() not in title.lower():
                title = f"{brand} {title}"
            elif not title and brand:
                title = brand

            if not title or len(title) < 3:
                continue

            # Image extraction
            img_el = card.select_one("img.MZeksS, img.UCc1lI, img.DByuf4, img._396cs4, img")
            img_url = None
            if img_el:
                img_url = img_el.get("src") or img_el.get("data-src")
                if not img_url and img_el.get("srcset"):
                    img_url = img_el.get("srcset").split(",")[0].split()[0]

            # Current Price
            price = None
            price_el = card.select_one(
                "div.hZ3P6w, div.Nx9bqj, div._30jeq3, div.QiMO5r div:first-child"
            )
            if price_el:
                price = price_el.get_text(strip=True)
            else:
                for el in card.find_all(["div", "span"]):
                    t = el.get_text(strip=True)
                    if t.startswith("₹") and len(t) < 20 and any(c.isdigit() for c in t):
                        price = t
                        break

            # List Price (MRP)
            list_price = None
            list_price_el = card.select_one("div.kRYCnD, div.yRaY8j, div._3I9_wc")
            if list_price_el:
                list_price = list_price_el.get_text(strip=True)

            # Rating & Review Count
            rating = None
            review_count = None
            
            rating_badge = card.select_one("div.XQDdHH, div._3LWZlK, div.hGSR34, span._1lRcqv")
            if rating_badge:
                try:
                    rating = float(rating_badge.get_text(strip=True))
                except ValueError:
                    rating = None

            rating_reviews_el = card.select_one("span.PvbNMB, span.Wphh3N, div.a7saXW, span._2_R_DZ")
            if rating_reviews_el:
                rr_text = rating_reviews_el.get_text(strip=True)
                if rating is None:
                    m_rat = re.search(r"^(\d(?:\.\d)?)", rr_text)
                    if m_rat:
                        try:
                            rating = float(m_rat.group(1))
                        except ValueError:
                            pass
                m_rev = re.search(r"([\d,]+)\s*(?:Ratings|Reviews)", rr_text, re.I)
                if m_rev:
                    try:
                        review_count = int(m_rev.group(1).replace(",", ""))
                    except ValueError:
                        pass

            # Bullet points / specs
            bullets: List[str] = []
            for li in card.select("li, div.fMghAE li"):
                bt = li.get_text(strip=True)
                if bt and len(bt) > 3 and not any(k in bt.lower() for k in ("bank offer", "exchange", "free delivery")):
                    bullets.append(bt)

            products.append({
                "id": pid,
                "pid": pid,
                "title": title,
                "brand": brand,
                "price": price,
                "list_price": list_price,
                "rating": rating,
                "review_count": review_count,
                "image_url": img_url,
                "url": full_url,
                "source": "flipkart.com",
                "bullets": bullets,
                "retrieved_at": datetime.now(timezone.utc),
            })

        return products

