from datetime import UTC, datetime

from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.guides import Guide, GuideItem, GuideItemType, GuideStatus
from app.models.users import User

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def _signup_and_login(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "name": "기록가이드테스터",
            "consents": CONSENTS,
        },
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


async def _create_guide_for_record(user_email: str, record_id: int) -> Guide:
    user = await User.get(email=user_email)
    guide = await Guide.create(
        user=user,
        record_id=record_id,
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
    return guide


class TestRecordGuideAPI(TestCase):
    async def test_get_record_guide_success(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "rg_ok@test.com")
            await _create_guide_for_record("rg_ok@test.com", record_id=12345)
            response = await client.get("/api/v1/records/12345/guide", headers=headers)
        assert response.status_code == status.HTTP_200_OK

    async def test_get_record_guide_not_found(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "rg_404@test.com")
            response = await client.get("/api/v1/records/99999/guide", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_record_guide_unauthorized(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/records/1/guide")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
