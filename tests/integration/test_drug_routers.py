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
