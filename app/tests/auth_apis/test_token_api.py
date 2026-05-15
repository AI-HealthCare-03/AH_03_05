from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app


class TestLogoutAPI(TestCase):
    async def test_logout_success(self):
        signup_data = {
            "email": "logout_test@example.com",
            "password": "Password123!",
            "name": "로그아웃테스터",
            "consents": [
                {"consent_type": "terms", "is_agreed": True},
                {"consent_type": "privacy", "is_agreed": True},
                {"consent_type": "sensitive_health", "is_agreed": True},
                {"consent_type": "ai_analysis", "is_agreed": True},
                {"consent_type": "marketing", "is_agreed": False},
            ],
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "logout_test@example.com", "password": "Password123!"},
            )
            refresh_token = login_response.json()["refresh_token"]
            response = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "로그아웃되었습니다."

    async def test_logout_invalid_token(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/logout", json={"refresh_token": "invalid_token"})
        assert response.status_code == status.HTTP_200_OK
