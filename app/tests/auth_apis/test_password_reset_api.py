from unittest.mock import AsyncMock, patch

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


class TestPasswordResetAPI(TestCase):
    async def test_request_password_reset_success(self):
        # Given
        email = "reset_test@example.com"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "재설정테스터",
                    "consents": CONSENTS,
                },
            )
            # When
            with patch("app.services.auth.send_email", new_callable=AsyncMock) as mock_email:
                response = await client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": email},
                )
                assert mock_email.called

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "인증 코드가 이메일로 발송되었습니다."

    async def test_request_password_reset_nonexistent_email(self):
        # Given & When (존재하지 않는 이메일도 200 반환 - 보안상)
        with patch("app.services.auth.send_email", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": "nonexistent@example.com"},
                )

        # Then
        assert response.status_code == status.HTTP_200_OK

    async def test_confirm_password_reset_success(self):
        # Given
        email = "reset_confirm@example.com"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "재설정확인테스터",
                    "consents": CONSENTS,
                },
            )
            with patch("app.services.auth.send_email", new_callable=AsyncMock):
                await client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": email},
                )
            # Redis에서 코드 직접 가져오기
            from app.core.redis import redis_client

            code = await redis_client.get(f"pw_reset:{email}")

            # When
            response = await client.post(
                "/api/v1/auth/password-reset/confirm",
                json={"email": email, "code": code, "new_password": "NewPassword123!"},
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "비밀번호가 변경되었습니다."

    async def test_confirm_password_reset_wrong_code(self):
        # Given
        email = "reset_wrong@example.com"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "잘못코드테스터",
                    "consents": CONSENTS,
                },
            )
            with patch("app.services.auth.send_email", new_callable=AsyncMock):
                await client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": email},
                )

            # When
            response = await client.post(
                "/api/v1/auth/password-reset/confirm",
                json={"email": email, "code": "000000", "new_password": "NewPassword123!"},
            )

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST
