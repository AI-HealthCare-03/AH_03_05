from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase
from app.main import app


class TestLoginAPI(TestCase):
    async def test_login_success(self):
        signup_data = {
            "email": "login_test@example.com",
            "password": "Password123!",
            "name": "로그인테스터",
            "consents": [
                {"consent_type": "terms", "is_agreed": True},
                {"consent_type": "privacy", "is_agreed": True},
                {"consent_type": "sensitive_health", "is_agreed": True},
                {"consent_type": "ai_analysis", "is_agreed": True},
                {"consent_type": "marketing", "is_agreed": False},
            ],
        }
        login_data = {"email": "login_test@example.com", "password": "Password123!"}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()
        assert "refresh_token" in response.json()

    async def test_login_invalid_credentials(self):
        login_data = {"email": "nonexistent@example.com", "password": "WrongPassword123!"}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
