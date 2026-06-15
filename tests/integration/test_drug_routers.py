"""
식약처(MFDS) drug_routers 통합 테스트.

외부 API 호출은 conftest의 mock_mfds_* fixture로 차단된다.
실제 식약처 API 없이도 라우터 로직과 에러 처리를 검증할 수 있다.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """FastAPI 앱을 직접 호출하는 비동기 클라이언트."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestDrugSearch:
    """GET /api/v1/drugs/search"""

    async def test_search_success(self, mock_mfds_search_success, client):
        """정상 검색: 약품 결과 반환"""
        response = await client.get("/api/v1/drugs/search?keyword=타이레놀")

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "MFDS"
        assert data["keyword"] == "타이레놀"
        assert len(data["results"]) == 2
        assert data["results"][0]["drug_name"] == "타이레놀정500mg"

    async def test_search_empty_keyword(self, client):
        """빈 keyword: 안내 메시지 (외부 호출 자체가 일어나지 않음)"""
        response = await client.get("/api/v1/drugs/search?keyword=   ")

        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []
        assert "검색어" in data["message"]

    async def test_search_no_results(self, mock_mfds_search_empty, client):
        """결과 0건: 안내 메시지"""
        response = await client.get("/api/v1/drugs/search?keyword=존재하지않는약품")

        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []
        assert "검색 결과가 없습니다" in data["message"]

    async def test_search_timeout(self, mock_mfds_search_timeout, client):
        """식약처 API timeout → 504"""
        response = await client.get("/api/v1/drugs/search?keyword=타이레놀")

        assert response.status_code == 504
        assert "응답 시간" in response.json()["detail"]

    async def test_search_cache_miss_then_hit(self, mock_mfds_search_success, client):
        """첫 검색은 캐시 미스(cache_used=False), 재검색은 캐시 히트(cache_used=True)."""
        first = await client.get("/api/v1/drugs/search?keyword=타이레놀")
        second = await client.get("/api/v1/drugs/search?keyword=타이레놀")
        assert first.json()["cache_used"] is False
        assert second.json()["cache_used"] is True
        assert second.json()["results"] == first.json()["results"]
        # 외부 식약처 API는 첫 호출에서만 1회 (캐시 히트 시 미호출)
        assert mock_mfds_search_success.call_count == 1

    async def test_search_no_results_not_cached(self, mock_mfds_search_empty, client):
        """결과 0건은 캐싱하지 않아 다음 호출도 외부 API를 탄다."""
        await client.get("/api/v1/drugs/search?keyword=존재하지않는약품")
        await client.get("/api/v1/drugs/search?keyword=존재하지않는약품")
        assert mock_mfds_search_empty.call_count == 2

    async def test_cache_serves_when_external_api_down(self, mocker, client):
        """외부 식약처 API가 다운돼도, 이미 캐싱된 검색어는 정상 응답한다."""
        from tests.integration.fixtures.mfds_responses import SEARCH_TYLENOL

        # 1차: 외부 API 정상 → 결과 캐싱됨
        mock_search = mocker.patch(
            "app.services.mfds_client.MFDSClient.search_drug",
            return_value=SEARCH_TYLENOL,
        )
        first = await client.get("/api/v1/drugs/search?keyword=타이레놀")
        assert first.status_code == 200
        assert first.json()["cache_used"] is False

        # 외부 API 다운 시뮬레이션 (이후 호출은 무조건 503 유발)
        import httpx

        mock_search.side_effect = httpx.HTTPStatusError(
            "Service Unavailable",
            request=httpx.Request("GET", "http://test"),
            response=httpx.Response(503, request=httpx.Request("GET", "http://test")),
        )

        # 2차: 외부 API는 죽었지만 캐시로 정상 응답
        second = await client.get("/api/v1/drugs/search?keyword=타이레놀")
        assert second.status_code == 200
        assert second.json()["cache_used"] is True
        assert second.json()["results"] == first.json()["results"]


class TestDrugDetail:
    """GET /api/v1/drugs/{drug_id}"""

    async def test_detail_success(self, mock_mfds_detail_success, client):
        """정상 상세 조회"""
        response = await client.get("/api/v1/drugs/197600020")

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "MFDS"
        assert data["drug_code"] == "197600020"
        assert data["data"]["drug_name"] == "타이레놀정500mg"
        assert data["data"]["manufacturer"] == "한국얀센"

    async def test_detail_not_found(self, mock_mfds_detail_not_found, client):
        """약품 없음 → 404"""
        response = await client.get("/api/v1/drugs/9999999999")

        assert response.status_code == 404
        assert "찾을 수 없습니다" in response.json()["detail"]

    async def test_detail_rate_limit(self, mock_mfds_detail_rate_limit, client):
        """429 rate limit → 429"""
        response = await client.get("/api/v1/drugs/197600020")

        assert response.status_code == 429
        assert "요청 한도" in response.json()["detail"]
