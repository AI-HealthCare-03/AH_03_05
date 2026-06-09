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


class TestConsentAPI(TestCase):
    async def test_get_consents_success(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "consent1@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.get("/api/v1/users/me/consents", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()["consents"]) == 5

    async def test_signup_sets_agreed_at_for_agreed_consents(self):
        # 가입 시 동의한 항목은 agreed_at이 채워지고, 비동의 항목은 null이어야 한다
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "consent_agreedat@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get("/api/v1/users/me/consents", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        consents = response.json()["consents"]
        for c in consents:
            if c["is_agreed"]:
                assert c["agreed_at"] is not None, f"{c['consent_type']} 동의했는데 agreed_at이 null"
            else:
                assert c["agreed_at"] is None

    async def test_get_consents_unauthorized(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # When
            response = await client.get("/api/v1/users/me/consents")

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_toggle_consent_success(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "consent2@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.patch(
                "/api/v1/users/me/consents/marketing",
                headers=headers,
                json={"is_agreed": True},
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["consent_type"] == "marketing"
        assert response.json()["is_agreed"] is True

    async def test_toggle_consent_not_found(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "consent3@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.patch(
                "/api/v1/users/me/consents/invalid_type",
                headers=headers,
                json={"is_agreed": True},
            )

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_toggle_required_consent_returns_400(self):
        # Given - 필수 약관 철회 시도
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "consent4@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            # When
            response = await client.patch(
                "/api/v1/users/me/consents/terms",
                headers=headers,
                json={"is_agreed": False},
            )
        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "회원탈퇴" in response.json()["detail"]
