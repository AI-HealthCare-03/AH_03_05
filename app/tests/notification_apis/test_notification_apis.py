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
    await client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "Password123!",
        "name": "테스터",
        "consents": CONSENTS,
    })
    login_response = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_response.json()["access_token"]


class TestNotificationAPI(TestCase):
    async def test_get_notifications_empty(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify1@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.get("/api/v1/notifications", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["items"] == []
        assert response.json()["unread_count"] == 0

    async def test_get_notifications_unauthorized(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # When
            response = await client.get("/api/v1/notifications")

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_read_notification_not_found(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify2@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.patch("/api/v1/notifications/99999/read", headers=headers)

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_delete_notification_not_found(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify3@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.delete("/api/v1/notifications/99999", headers=headers)

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND
