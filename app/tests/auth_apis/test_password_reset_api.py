import uuid
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
    def setUp(self):
        self.email1 = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        self.email2 = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        self.email3 = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        self.email4 = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        self.email5 = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        self.email6 = f"reset_{uuid.uuid4().hex[:8]}@example.com"

    async def test_request_password_reset_success(self):
        # Given
        email = self.email1
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
                    json={"email": self.email2},
                )

        # Then
        assert response.status_code == status.HTTP_200_OK

    async def test_confirm_password_reset_success(self):
        # Given
        email = self.email3
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
        email = self.email4
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

    async def test_request_password_reset_cooldown(self):
        """1분 내 재요청 시 429 반환"""
        email = self.email5
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "쿨다운테스터",
                    "consents": CONSENTS,
                },
            )
            with patch("app.services.auth.send_email", new_callable=AsyncMock):
                first = await client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": email},
                )
                second = await client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": email},
                )

        assert first.status_code == status.HTTP_200_OK
        assert second.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    async def test_confirm_password_reset_brute_force(self):
        """5회 실패 시 코드 무효화 후 재시도도 400"""
        email = self.email6
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "브루트포스테스터",
                    "consents": CONSENTS,
                },
            )
            with patch("app.services.auth.send_email", new_callable=AsyncMock):
                await client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": email},
                )

            for _ in range(5):
                await client.post(
                    "/api/v1/auth/password-reset/confirm",
                    json={"email": email, "code": "000000", "new_password": "NewPassword123!"},
                )

            from app.core.redis import redis_client

            code = await redis_client.get(f"pw_reset:{email}")
            assert code is None
