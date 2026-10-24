from backend.app.services.product_normalizer import (
    parse_numeric,
    is_valid_http_url,
    make_stable_product_id,
    normalize_raw_product,
    deduplicate_products,
)


def test_parse_numeric():
    assert parse_numeric("₹45,999") == 45999.0
    assert parse_numeric("45999.50") == 45999.5
    assert parse_numeric(50000) == 50000.0
    assert parse_numeric(None) is None
    assert parse_numeric("N/A") is None
    assert parse_numeric("Out of Stock") is None
    assert parse_numeric(False) is None
    assert parse_numeric("1,25,000") == 125000.0


def test_url_validation():
    assert is_valid_http_url("https://www.amazon.in/dp/B0GWHGS8P5") is True
    assert is_valid_http_url("http://flipkart.com/item/p/123") is True
    assert is_valid_http_url("ftp://example.com") is False
    assert is_valid_http_url("/relative/path") is False
    assert is_valid_http_url(None) is False
    assert is_valid_http_url("") is False


def test_stable_id_generation():
    id1 = make_stable_product_id("amazon.in", "B0GWHGS8P5", "https://amazon.in/dp/B0GWHGS8P5")
    assert id1 == "amazon.in:B0GWHGS8P5"

    id2 = make_stable_product_id("flipkart.com", "PID123", "https://flipkart.com/p?pid=PID123")
    assert id2 == "flipkart.com:PID123"

    # Extract from URL when raw_id missing
    id3 = make_stable_product_id("amazon.in", None, "https://amazon.in/product/B012345678/ref=1")
    assert id3 == "amazon.in:B012345678"

    # Idempotent: Does not create double prefixes
    id4 = make_stable_product_id("flipkart.com", "flipkart.com:PID123", "https://flipkart.com/p?pid=PID123")
    assert id4 == "flipkart.com:PID123"
    id5 = make_stable_product_id("amazon.in", "amazon.in:B0GWHGS8P5", "https://amazon.in/dp/B0GWHGS8P5")
    assert id5 == "amazon.in:B0GWHGS8P5"


def test_normalize_raw_product():
    raw = {
        "id": "ASIN123456",
        "title": " Dell Inspiron 15 Laptop   ",
        "price": "₹54,990",
        "list_price": "₹70,000",
        "rating": "4.2",
        "review_count": "1,200",
        "url": "https://www.amazon.in/dp/ASIN123456",
        "image_url": "https://images.example.com/laptop.jpg",
        "brand": "Dell",
        "bullets": ["16GB RAM", "512GB SSD"],
    }
    prod = normalize_raw_product(raw, "amazon.in")
    assert prod is not None
    assert prod.id == "amazon.in:ASIN123456"
    assert prod.title == "Dell Inspiron 15 Laptop"
    assert prod.price.amount == 54990.0
    assert prod.price.currency == "INR"
    assert prod.list_price.amount == 70000.0
    assert prod.rating == 4.2
    assert prod.review_count == 1200
    assert len(prod.feature_evidence) == 2
    assert prod.provenance.missing_fields == []
    assert prod.provenance.completeness == 1.0


def test_normalize_missing_and_malformed():
    raw_missing = {
        "url": "https://www.flipkart.com/p/item?pid=XYZ987",
        "title": "Unbranded Item",
        "price": "Call for price",
        "rating": "Invalid",
        "review_count": None,
        "image_url": "invalid_url",
    }
    prod = normalize_raw_product(raw_missing, "flipkart.com")
    assert prod is not None
    assert prod.price is None
    assert prod.rating is None
    assert prod.review_count is None
    assert prod.image_url is None
    assert "price" in prod.provenance.missing_fields
    assert "rating" in prod.provenance.missing_fields
    assert prod.provenance.completeness < 0.5


def test_deduplication():
    raw = {
        "id": "ASIN1",
        "title": "Item 1",
        "url": "https://www.amazon.in/dp/ASIN1",
    }
    p1 = normalize_raw_product(raw, "amazon.in")
    p2 = normalize_raw_product(raw, "amazon.in")
    raw2 = {
        "id": "ASIN2",
        "title": "Item 2",
        "url": "https://www.amazon.in/dp/ASIN2",
    }
    p3 = normalize_raw_product(raw2, "amazon.in")

    deduped = deduplicate_products([p1, p2, p3])
    assert len(deduped) == 2
    assert {p.id for p in deduped} == {"amazon.in:ASIN1", "amazon.in:ASIN2"}
