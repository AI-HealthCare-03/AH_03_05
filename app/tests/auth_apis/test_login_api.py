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


class TestLoginAPI(TestCase):
    async def test_login_success(self):
        # Given
        signup_data = {
            "email": "login_test@example.com",
            "password": "Password123!",
            "name": "로그인테스터",
            "consents": CONSENTS,
        }
        login_data = {"email": "login_test@example.com", "password": "Password123!"}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)

            # When
            response = await client.post("/api/v1/auth/login", json=login_data)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()
        assert "refresh_token" in response.json()

    async def test_login_invalid_credentials(self):
        # Given
        login_data = {"email": "nonexistent@example.com", "password": "WrongPassword123!"}

        # When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/login", json=login_data)

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_login_lockout_after_5_failures(self):
        # Given
        signup_data = {
            "email": "lockout_test@example.com",
            "password": "Password123!",
            "name": "잠금테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            # 5회 실패
            for _ in range(5):
                await client.post(
                    "/api/v1/auth/login",
                    json={"email": "lockout_test@example.com", "password": "WrongPassword123!"},
                )
            # When - 6번째 시도
            response = await client.post(
                "/api/v1/auth/login",
                json={"email": "lockout_test@example.com", "password": "WrongPassword123!"},
            )
        # Then
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
