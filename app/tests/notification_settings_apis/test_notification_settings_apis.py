from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def get_access_token(client: AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "name": "테스터",
            "consents": CONSENTS,
        },
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "Password123!",
        },
    )
    return login_response.json()["access_token"]


class TestNotificationSettingsAPI(TestCase):
    async def test_put_notification_settings_success(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notiset1@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.put(
                "/api/v1/notification-settings",
                json={
                    "guide_complete_alarm": False,
                    "ocr_complete_alarm": True,
                    "system_alarm": False,
                },
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["guide_complete_alarm"] is False
        assert data["ocr_complete_alarm"] is True
        assert data["system_alarm"] is False
        assert "updated_at" in data

    async def test_put_notification_settings_upsert(self):
        # Given: 두 번 호출해도 중복 생성 없이 업데이트
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notiset2@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            await client.put(
                "/api/v1/notification-settings",
                json={
                    "guide_complete_alarm": True,
                    "ocr_complete_alarm": True,
                    "system_alarm": True,
                },
                headers=headers,
            )

            # When
            response = await client.put(
                "/api/v1/notification-settings",
                json={
                    "guide_complete_alarm": False,
                    "ocr_complete_alarm": False,
                    "system_alarm": False,
                },
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["guide_complete_alarm"] is False
        assert data["ocr_complete_alarm"] is False
        assert data["system_alarm"] is False

    async def test_put_notification_settings_unauthorized(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # When
            response = await client.put(
                "/api/v1/notification-settings",
                json={
                    "guide_complete_alarm": True,
                    "ocr_complete_alarm": True,
                    "system_alarm": True,
                },
            )

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
