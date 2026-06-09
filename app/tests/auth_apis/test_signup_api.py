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


class TestSignupAPI(TestCase):
    async def test_signup_success(self):
        # Given
        signup_data = {
            "email": "test@example.com",
            "password": "Password123!",
            "name": "테스터",
            "nickname": "테스터닉",
            "consents": CONSENTS,
        }

        # When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/signup", json=signup_data)

        # Then
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["email"] == "test@example.com"
        assert response.json()["required_consents_saved"] is True

    async def test_signup_invalid_email(self):
        # Given
        signup_data = {
            "email": "invalid-email",
            "password": "Password123!",
            "name": "테스터",
            "consents": [],
        }

        # When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/signup", json=signup_data)

        # Then
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    async def test_signup_password_too_short(self):
        # Given - 8자 미만 비밀번호
        signup_data = {
            "email": "short_pw@example.com",
            "password": "Ab1!",
            "name": "테스터",
            "consents": CONSENTS,
        }
        # When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/signup", json=signup_data)
        # Then
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    async def test_signup_password_weak_policy(self):
        # Given - 3종류 미만 조합 (소문자+숫자만)
        signup_data = {
            "email": "weak_pw@example.com",
            "password": "password123",
            "name": "테스터",
            "consents": CONSENTS,
        }
        # When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/signup", json=signup_data)
        # Then
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    async def test_signup_password_similar_to_email(self):
        # Given - 비밀번호에 이메일 주소 포함
        signup_data = {
            "email": "testuser@example.com",
            "password": "testuser123!",
            "name": "테스터",
            "consents": CONSENTS,
        }
        # When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/signup", json=signup_data)
        # Then
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    async def test_signup_password_similar_to_name(self):
        # Given - 비밀번호에 이름 포함
        signup_data = {
            "email": "another@example.com",
            "password": "Hong123!Gil",
            "name": "Hong",
            "consents": CONSENTS,
        }
        # When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/signup", json=signup_data)
        # Then
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
