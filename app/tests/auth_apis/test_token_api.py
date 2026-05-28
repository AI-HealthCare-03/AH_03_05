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


class TestLogoutAPI(TestCase):
    async def test_logout_success(self):
        # Given
        signup_data = {
            "email": "logout_test@example.com",
            "password": "Password123!",
            "name": "로그아웃테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "logout_test@example.com", "password": "Password123!"},
            )
            refresh_token = login_response.json()["refresh_token"]

            # When
            response = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "로그아웃되었습니다."

    async def test_logout_invalid_token(self):
        # Given & When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/logout", json={"refresh_token": "invalid_token"})

        # Then
        assert response.status_code == status.HTTP_200_OK


class TestRefreshAPI(TestCase):
    async def test_refresh_success(self):
        # Given
        signup_data = {
            "email": "refresh_test@example.com",
            "password": "Password123!",
            "name": "리프레시테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "refresh_test@example.com", "password": "Password123!"},
            )
            refresh_token = login_response.json()["refresh_token"]
            # When
            response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        # Then
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()

    async def test_refresh_invalid_token(self):
        # Given & When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid_token"})
        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_refresh_revoked_token(self):
        # Given
        signup_data = {
            "email": "refresh_revoked@example.com",
            "password": "Password123!",
            "name": "리프레시취소테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "refresh_revoked@example.com", "password": "Password123!"},
            )
            refresh_token = login_response.json()["refresh_token"]
            # 로그아웃으로 토큰 revoke
            await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
            # When
            response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_refresh_twice_in_a_row(self):
        # Given
        signup_data = {
            "email": "refresh_twice@example.com",
            "password": "Password123!",
            "name": "연속리프레시테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "refresh_twice@example.com", "password": "Password123!"},
            )
            refresh_token = login_response.json()["refresh_token"]
            # 1차 refresh
            first_refresh = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
            assert first_refresh.status_code == status.HTTP_200_OK
            new_refresh_token = first_refresh.json().get("refresh_token")

            # When - 새 refresh_token으로 2차 refresh
            response = await client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh_token})

        # Then
        assert response.status_code == status.HTTP_200_OK
