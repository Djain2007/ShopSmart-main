from pathlib import Path
import pytest
from backend.app.scrapers.amazon import AmazonScraper
from backend.app.scrapers.flipkart import FlipkartScraper

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_amazon_scraper_html_parsing():
    html_path = FIXTURES_DIR / "amazon_search.html"
    assert html_path.exists()
    html = html_path.read_text(encoding="utf-8")

    scraper = AmazonScraper()
    products = scraper.parse_search_page(html)

    assert len(products) == 2
    
    p1 = products[0]
    assert p1["id"] == "B0GWHGS8P5"
    assert "Dell 15" in p1["title"]
    assert "66,990" in p1["price"]
    assert "89,990" in p1["list_price"]
    assert p1["rating"] == 4.3
    assert p1["review_count"] == 145
    assert p1["url"] == "https://www.amazon.in/Dell-15-Laptop-Core-Ultra/dp/B0GWHGS8P5"
    assert len(p1["bullets"]) >= 2

    p2 = products[1]
    assert p2["id"] == "B0H45YFPJT"
    assert "Acer Aspire" in p2["title"]
    assert "49,990" in p2["price"]
    assert p2["rating"] == 4.1
    assert p2["review_count"] == 380


def test_flipkart_scraper_html_parsing():
    html_path = FIXTURES_DIR / "flipkart_search.html"
    assert html_path.exists()
    html = html_path.read_text(encoding="utf-8")

    scraper = FlipkartScraper()
    products = scraper.parse_search_page(html)

    assert len(products) == 2

    p1 = products[0]
    assert p1["id"] == "COMHPDSBZGUAUVBT"
    assert "Acer Aspire" in p1["title"]
    assert "37,990" in p1["price"]
    assert "74,999" in p1["list_price"]
    assert p1["rating"] == 3.9
    assert p1["review_count"] == 258
    assert "/p/" in p1["url"]
    assert len(p1["bullets"]) >= 2

    p2 = products[1]
    assert p2["id"] == "COMGXYZ123456789"
    assert "HP Victus" in p2["title"]
    assert "62,490" in p2["price"]
    assert p2["rating"] == 4.4
    assert p2["review_count"] == 1020


def test_flipkart_shoes_fashion_grid_parsing():
    html_path = FIXTURES_DIR / "flipkart_shoes_search.html"
    assert html_path.exists()
    html = html_path.read_text(encoding="utf-8")

    scraper = FlipkartScraper()
    products = scraper.parse_search_page(html)

    assert len(products) == 2

    p1 = products[0]
    assert p1["id"] == "SHOHDXRZ6XEP6EJ6"
    assert "Abros" in p1["title"]
    assert "MALFOY" in p1["title"]
    assert "738" in p1["price"]
    assert "2,599" in p1["list_price"]
    assert p1["brand"] == "Abros"
    assert p1["image_url"] == "https://rukminim2.flixcart.com/image/612/612/shoe1.jpeg"
    assert p1["rating"] is None

    p2 = products[1]
    assert p2["id"] == "SHOH8PFQQPRYGUHC"
    assert "NOBELITE" in p2["title"]
    assert "314" in p2["price"]
    assert "2,499" in p2["list_price"]
    assert p2["brand"] == "NOBELITE"


def test_flipkart_scraper_bot_challenge_detection():
    html_path = FIXTURES_DIR / "flipkart_challenge.html"
    assert html_path.exists()
    html = html_path.read_text(encoding="utf-8")

    scraper = FlipkartScraper()
    from backend.app.scrapers.base import BotChallengeError
    with pytest.raises(BotChallengeError):
        scraper.parse_search_page(html)


def test_flipkart_scraper_tolerates_missing_optional_fields():
    html = """
    <div data-id="MINIMAL123" style="width:25%">
        <a href="/minimal-product/p/itm1234?pid=MINIMAL123" class="atJtCj" title="Minimal Product">Minimal Product</a>
        <div class="Nx9bqj">₹999</div>
    </div>
    """
    scraper = FlipkartScraper()
    products = scraper.parse_search_page(html)
    assert len(products) == 1
    assert products[0]["id"] == "MINIMAL123"
    assert products[0]["title"] == "Minimal Product"
    assert products[0]["price"] == "₹999"
    assert products[0]["rating"] is None
    assert products[0]["review_count"] is None
    assert products[0]["list_price"] is None
    assert products[0]["image_url"] is None


def test_flipkart_scraper_json_ld_fallback():
    html = """
    <html>
    <head>
        <script type="application/ld+json">
        [{"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"@type":"ListItem","name":"Structured Fallback Shoes","url":"https://www.flipkart.com/shoe/p/itm123?pid=FALLBACK999"}]}]
        </script>
    </head>
    <body>
        <div data-id="FALLBACK999">
            <a href="/shoe/p/itm123?pid=FALLBACK999"></a>
            <div class="Nx9bqj">₹1,499</div>
        </div>
    </body>
    </html>
    """
    scraper = FlipkartScraper()
    products = scraper.parse_search_page(html)
    assert len(products) == 1
    assert products[0]["id"] == "FALLBACK999"
    assert products[0]["title"] == "Structured Fallback Shoes"
    assert products[0]["price"] == "₹1,499"


def test_amazon_scraper_bot_challenge_detection():
    html = """
    <html>
    <head><title>Robot Check</title></head>
    <body>
    <form action="/errors/validateCaptcha">
        <p>Type the characters you see in this image</p>
    </form>
    </body>
    </html>
    """
    scraper = AmazonScraper()
    from backend.app.scrapers.base import BotChallengeError
    with pytest.raises(BotChallengeError):
        scraper.parse_search_page(html)


def test_flipkart_earbuds_parsing():
    """Regression test for Search A query 'wireless earbuds' using sanitized Flipkart HTML."""
    html_path = FIXTURES_DIR / "flipkart_earbuds_search.html"
    assert html_path.exists()
    html = html_path.read_text(encoding="utf-8")

    scraper = FlipkartScraper()
    products = scraper.parse_search_page(html)

    assert len(products) == 4

    p1 = products[0]
    assert p1["id"] == "ACCG9GXYZ111"
    assert "boAt Airdopes 141" in p1["title"]
    assert "1,299" in p1["price"]
    assert "4,490" in p1["list_price"]
    assert p1["rating"] == 4.0
    assert p1["review_count"] == 21432
    assert p1["source"] == "flipkart.com"
    assert len(p1["bullets"]) >= 2

    p2 = products[1]
    assert p2["id"] == "ACCH8HXYZ222"
    assert "realme Buds T300" in p2["title"]
    assert "2,299" in p2["price"]
    assert p2["rating"] == 4.4
    assert p2["review_count"] == 8450


def test_flipkart_running_shoes_parsing():
    """Regression test for Search B query 'Running Shoes under 1500 black colour' using sanitized Flipkart HTML."""
    html_path = FIXTURES_DIR / "flipkart_running_shoes_search.html"
    assert html_path.exists()
    html = html_path.read_text(encoding="utf-8")

    scraper = FlipkartScraper()
    products = scraper.parse_search_page(html)

    assert len(products) == 4

    # Campus
    p1 = products[0]
    assert p1["id"] == "SHOK7KXYZ555"
    assert "CAMPUS" in p1["title"]
    assert "1,199" in p1["price"]
    assert "1,699" in p1["list_price"]
    assert p1["brand"] == "CAMPUS"
    assert p1["rating"] == 4.2

    # Asian
    p2 = products[1]
    assert p2["id"] == "SHOL8LXYZ666"
    assert "ASIAN" in p2["title"]
    assert "899" in p2["price"]
    assert p2["rating"] == 4.1

    # Red Tape
    p4 = products[3]
    assert p4["id"] == "SHON0NXYZ888"
    assert "RED TAPE" in p4["title"]
    assert "1,349" in p4["price"]
    assert "5,599" in p4["list_price"]


def test_flipkart_empty_page_returns_no_products():
    """Test valid Flipkart HTML containing zero extractable products returns empty list without error or fake items."""
    html_path = FIXTURES_DIR / "flipkart_empty_search.html"
    assert html_path.exists()
    html = html_path.read_text(encoding="utf-8")

    scraper = FlipkartScraper()
    products = scraper.parse_search_page(html)
    assert products == []


