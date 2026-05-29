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


class TestEmailVerifyAPI(TestCase):
    def setUp(self):
        self.email1 = f"verify_{uuid.uuid4().hex[:8]}@example.com"
        self.email2 = f"verify_{uuid.uuid4().hex[:8]}@example.com"
        self.email3 = f"verify_{uuid.uuid4().hex[:8]}@example.com"
        self.email4 = f"verify_{uuid.uuid4().hex[:8]}@example.com"
        self.email5 = f"verify_{uuid.uuid4().hex[:8]}@example.com"

    async def test_send_verification_code_success(self):
        # Given & When
        with patch("app.services.auth.send_email", new_callable=AsyncMock) as mock_email:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/auth/email-verify/send-code",
                    json={"email": self.email1},
                )
                assert mock_email.called

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "인증 코드가 이메일로 발송되었습니다."

    async def test_send_verification_code_cooldown(self):
        """1분 내 재요청 시 429 반환"""
        with patch("app.services.auth.send_email", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                first = await client.post(
                    "/api/v1/auth/email-verify/send-code",
                    json={"email": self.email2},
                )
                second = await client.post(
                    "/api/v1/auth/email-verify/send-code",
                    json={"email": self.email2},
                )

        assert first.status_code == status.HTTP_200_OK
        assert second.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    async def test_verify_code_success(self):
        # Given
        with patch("app.services.auth.send_email", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                await client.post(
                    "/api/v1/auth/email-verify/send-code",
                    json={"email": self.email3},
                )
                from app.core.redis import redis_client

                code = await redis_client.get(f"email_verify:{self.email3}")

                # When
                response = await client.post(
                    "/api/v1/auth/email-verify/verify-code",
                    json={"email": self.email3, "code": code},
                )

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "이메일 인증이 완료되었습니다."

    async def test_verify_code_wrong_code(self):
        # Given
        with patch("app.services.auth.send_email", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                await client.post(
                    "/api/v1/auth/email-verify/send-code",
                    json={"email": self.email4},
                )
                # When
                response = await client.post(
                    "/api/v1/auth/email-verify/verify-code",
                    json={"email": self.email4, "code": "000000"},
                )

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_verify_code_brute_force(self):
        """5회 실패 시 코드 무효화"""
        with patch("app.services.auth.send_email", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                await client.post(
                    "/api/v1/auth/email-verify/send-code",
                    json={"email": self.email5},
                )
                for _ in range(5):
                    await client.post(
                        "/api/v1/auth/email-verify/verify-code",
                        json={"email": self.email5, "code": "000000"},
                    )

                from app.core.redis import redis_client

                code = await redis_client.get(f"email_verify:{self.email5}")
                assert code is None
