from unittest.mock import AsyncMock, patch

from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app

SAMPLE_MFDS_ITEM = {
    "ITEM_SEQ": "200000001",
    "ITEM_NAME": "타이레놀정500밀리그람",
    "ENTP_NAME": "한국얀센",
    "EE_DOC_DATA": "해열·진통",
}


class TestDrugSearchCache(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        from app.core.redis import redis_client

        await redis_client.flushdb()

    async def test_search_empty_keyword_skips_api_and_cache(self):
        with patch("app.apis.v1.drug_routers.MFDSClient") as mock_client_cls:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/api/v1/drugs/search?keyword=  ")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["results"] == []
        assert body["cache_used"] is False
        mock_client_cls.assert_not_called()

    async def test_first_search_is_cache_miss(self):
        mock_instance = AsyncMock()
        mock_instance.search_drug = AsyncMock(return_value=[SAMPLE_MFDS_ITEM])
        with patch("app.apis.v1.drug_routers.MFDSClient", return_value=mock_instance):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/api/v1/drugs/search?keyword=타이레놀")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["cache_used"] is False
        assert len(body["results"]) == 1
        mock_instance.search_drug.assert_awaited_once()

    async def test_second_search_is_cache_hit(self):
        mock_instance = AsyncMock()
        mock_instance.search_drug = AsyncMock(return_value=[SAMPLE_MFDS_ITEM])
        with patch("app.apis.v1.drug_routers.MFDSClient", return_value=mock_instance):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                first = await client.get("/api/v1/drugs/search?keyword=타이레놀")
                second = await client.get("/api/v1/drugs/search?keyword=타이레놀")

        assert first.json()["cache_used"] is False
        assert second.json()["cache_used"] is True
        assert second.json()["results"] == first.json()["results"]
        mock_instance.search_drug.assert_awaited_once()

    async def test_no_result_is_not_cached(self):
        mock_instance = AsyncMock()
        mock_instance.search_drug = AsyncMock(return_value=[])
        with patch("app.apis.v1.drug_routers.MFDSClient", return_value=mock_instance):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                await client.get("/api/v1/drugs/search?keyword=없는약")
                await client.get("/api/v1/drugs/search?keyword=없는약")

        assert mock_instance.search_drug.await_count == 2
