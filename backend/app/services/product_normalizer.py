from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from backend.app.models.schemas import (
    LIMITS,
    EvidenceSnippet,
    Money,
    Product,
    Provenance,
    SourceName,
)


def parse_numeric(v: Any) -> Optional[float]:
    """Parse numeric values cleanly; returns None for unknown/None/bool values."""
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if not s or s.lower() in ("n/a", "none", "null", "unknown", "nan", "free"):
        return None
    m = re.search(r"\d[\d,]*(?:\.\d+)?", s)
    if m:
        try:
            return float(m.group(0).replace(",", ""))
        except ValueError:
            return None
    return None


def is_valid_http_url(url: Optional[str]) -> bool:
    """Validate absolute http/https URLs."""
    if not url or not isinstance(url, str):
        return False
    if len(url) > LIMITS["product_url_max_chars"]:
        return False
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def normalize_title(title: Any) -> str:
    """Clean and truncate title to limits."""
    if not title:
        return "Untitled Product"
    t = " ".join(str(title).split()).strip()
    return t[:LIMITS["product_title_max_chars"]] or "Untitled Product"


def make_stable_product_id(source: SourceName, raw_id: Optional[str], url: str) -> str:
    """Generate a stable, unique product ID that conforms to pattern ^[A-Za-z0-9._:-]+$."""
    clean_id = ""
    if raw_id:
        clean_id = re.sub(r"[^A-Za-z0-9._:-]", "", str(raw_id).strip())
        if clean_id.startswith(f"{source}:"):
            clean_id = clean_id[len(source) + 1:]
    if not clean_id:
        # Extract from URL
        if source == "amazon.in":
            m = re.search(r"/(?:dp|gp/product|product)/([A-Z0-9]{10})", url)
            if m:
                clean_id = m.group(1)
        elif source == "flipkart.com":
            m = re.search(r"[?&]pid=([A-Za-z0-9]+)", url)
            if m:
                clean_id = m.group(1)
    if not clean_id:
        # Fallback to hash of URL
        import hashlib
        clean_id = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]

    full_id = f"{source}:{clean_id}"
    return full_id[:LIMITS["product_id_max_chars"]]


def normalize_raw_product(raw: Dict[str, Any], source: SourceName) -> Optional[Product]:
    """
    Transforms loosely scraped raw product dictionaries into strict canonical Product models.
    Preserves null values without fabricating missing prices, ratings, or urls.
    """
    url = raw.get("url") or ""
    if not is_valid_http_url(url):
        return None

    raw_id = raw.get("id") or raw.get("asin") or raw.get("pid")
    product_id = make_stable_product_id(source, raw_id, url)
    title = normalize_title(raw.get("title"))

    # Price parsing
    price_val = parse_numeric(raw.get("price"))
    price_money = Money(amount=price_val, currency="INR") if price_val is not None and price_val > 0 else None

    list_price_val = parse_numeric(raw.get("list_price"))
    list_price_money = Money(amount=list_price_val, currency="INR") if list_price_val is not None and list_price_val > 0 else None

    # Rating parsing (0.0 to 5.0 only)
    raw_rating = parse_numeric(raw.get("rating"))
    rating = raw_rating if raw_rating is not None and 0.0 <= raw_rating <= 5.0 else None

    # Review count
    raw_reviews = parse_numeric(raw.get("review_count"))
    review_count = int(raw_reviews) if raw_reviews is not None and raw_reviews >= 0 else None

    # Image URL validation
    image_url = raw.get("image_url")
    if image_url and not is_valid_http_url(image_url):
        image_url = None

    # Brand
    brand = raw.get("brand")
    if brand:
        brand = str(brand).strip()[:80] or None

    # Attributes
    raw_attrs = raw.get("attributes") or {}
    clean_attrs: Dict[str, Any] = {}
    if isinstance(raw_attrs, dict):
        for k, v in list(raw_attrs.items())[:LIMITS["attributes_max"]]:
            k_clean = str(k).strip()[:LIMITS["attribute_key_max_chars"]]
            if k_clean:
                if isinstance(v, (int, float, bool)):
                    clean_attrs[k_clean] = v
                elif v is not None:
                    clean_attrs[k_clean] = str(v).strip()[:LIMITS["attribute_value_max_chars"]]
                else:
                    clean_attrs[k_clean] = None

    # Evidence / bullet points
    evidence: List[EvidenceSnippet] = []
    raw_bullets = raw.get("bullets") or raw.get("features") or []
    if isinstance(raw_bullets, list):
        for b in raw_bullets[:LIMITS["feature_evidence_max"]]:
            b_text = str(b).strip()
            if b_text:
                evidence.append(EvidenceSnippet(
                    text=b_text[:LIMITS["feature_evidence_text_max_chars"]],
                    field="bullet_points",
                ))

    # Provenance
    missing_fields = []
    if price_money is None:
        missing_fields.append("price")
    if rating is None:
        missing_fields.append("rating")
    if review_count is None:
        missing_fields.append("review_count")
    if image_url is None:
        missing_fields.append("image_url")

    # Completeness score
    present = 4 - len(missing_fields)
    completeness = round(present / 4.0, 2)

    retrieved_at_val = raw.get("retrieved_at")
    if not isinstance(retrieved_at_val, datetime):
        retrieved_at_val = datetime.now(timezone.utc)

    return Product(
        id=product_id,
        title=title,
        brand=brand,
        price=price_money,
        list_price=list_price_money,
        rating=rating,
        review_count=review_count,
        image_url=image_url,
        url=url,
        source=source,
        attributes=clean_attrs,
        feature_evidence=evidence,
        retrieved_at=retrieved_at_val,
        provenance=Provenance(
            method="scraper",
            completeness=completeness,
            missing_fields=missing_fields,
            warnings=[],
            synthetic=False,
        ),
    )


def deduplicate_products(products: List[Product]) -> List[Product]:
    """Deduplicate products by stable product ID and unique URL."""
    seen_ids = set()
    seen_urls = set()
    deduped: List[Product] = []

    for p in products:
        if p.id in seen_ids or p.url in seen_urls:
            continue
        seen_ids.add(p.id)
        seen_urls.add(p.url)
        deduped.append(p)

    return deduped
