from datetime import UTC, datetime

from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.guides import (
    Guide,
    GuideItem,
    GuideItemType,
    GuideStatus,
)
from app.models.users import User

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def _signup_and_login(client: AsyncClient, email: str) -> dict[str, str]:
    """회원가입 + 로그인 후 Bearer 헤더 반환."""
    await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "name": "조회테스터",
            "consents": CONSENTS,
        },
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


async def _create_guide_with_items(user_email: str) -> Guide:
    """테스트용 Guide + GuideItem 직접 생성."""
    user = await User.get(email=user_email)
    guide = await Guide.create(
        user=user,
        record_id=None,
        status=GuideStatus.COMPLETED,
        medication_guide="복약 안내 본문",
        lifestyle_guide="생활습관 가이드 본문",
        warning_message=None,
        disclaimer="본 안내는 의료 진단을 대체하지 않아요.",
        generated_at=datetime.now(UTC),
    )
    await GuideItem.create(
        guide=guide,
        item_type=GuideItemType.MEDICATION,
        title="복용 방법",
        content="식후 30분에 복용해주세요.",
        sort_order=1,
    )
    await GuideItem.create(
        guide=guide,
        item_type=GuideItemType.LIFESTYLE,
        title="식이 관리",
        content="저염식을 권장합니다.",
        sort_order=2,
    )
    return guide


class TestGuideDetailAPI(TestCase):
    async def test_get_guide_without_auth_returns_401(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/guides/1")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_nonexistent_guide_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "guide_detail_404@example.com")
            response = await client.get(
                "/api/v1/guides/999999",
                headers=headers,
            )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_other_user_guide_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # user A가 가이드 생성
            await _signup_and_login(client, "guide_detail_a@example.com")
            guide_a = await _create_guide_with_items("guide_detail_a@example.com")

            # user B로 user A 가이드 조회 시도
            headers_b = await _signup_and_login(client, "guide_detail_b@example.com")
            response = await client.get(
                f"/api/v1/guides/{guide_a.id}",
                headers=headers_b,
            )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_guide_success_returns_200(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "guide_detail_ok@example.com")
            guide = await _create_guide_with_items("guide_detail_ok@example.com")

            response = await client.get(
                f"/api/v1/guides/{guide.id}",
                headers=headers,
            )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["guide_id"] == guide.id
        assert body["status"] == "COMPLETED"
        assert body["medication_guide"] == "복약 안내 본문"
        assert body["lifestyle_guide"] == "생활습관 가이드 본문"
        assert body["data_source"]["type"] == "REALTIME"

        # GuideItem 2개 정렬 순서대로 반환되는지
        assert len(body["guide_items"]) == 2
        assert body["guide_items"][0]["sort_order"] == 1
        assert body["guide_items"][0]["item_type"] == "MEDICATION"
        assert body["guide_items"][1]["sort_order"] == 2
        assert body["guide_items"][1]["item_type"] == "LIFESTYLE"
