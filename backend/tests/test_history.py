import os
import tempfile
import pytest
from backend.app.services.history_service import HistoryService


@pytest.mark.asyncio
async def test_history_service_crud():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        service = HistoryService(db_path=db_path)
        await service.init_db()

        # Search history
        await service.add_search_history("gaming laptop", 15, "Laptop | Budget: Any")
        await service.add_search_history("wireless earbuds", 8, "Audio | Budget: 3000")

        history = await service.get_search_history(10)
        assert len(history) == 2
        assert history[0]["query"] == "wireless earbuds"

        # Save product
        prod_data = {
            "id": "amazon.in:B012345",
            "title": "Test Wireless Mouse",
            "price": 899.0,
            "image_url": "https://example.com/mouse.jpg",
            "url": "https://amazon.in/dp/B012345",
            "source": "amazon.in",
            "rating": 4.5,
        }
        saved_ok = await service.save_product(prod_data)
        assert saved_ok is True

        saved_list = await service.get_saved_products()
        assert len(saved_list) == 1
        assert saved_list[0]["product_id"] == "amazon.in:B012345"

        saved_ids = await service.get_saved_product_ids()
        assert "amazon.in:B012345" in saved_ids

        # Remove product
        rm_ok = await service.remove_saved_product("amazon.in:B012345")
        assert rm_ok is True

        saved_list_after = await service.get_saved_products()
        assert len(saved_list_after) == 0

        # Clear history
        await service.clear_search_history()
        history_after = await service.get_search_history(10)
        assert len(history_after) == 0

    finally:
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                pass
