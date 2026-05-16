from io import BytesIO
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


class TestMedicalRecordAPI(TestCase):
    async def test_upload_record_success(self):
        # Given
        signup_data = {
            "email": "record@example.com",
            "password": "Password123!",
            "name": "기록테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "record@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["record_id"] is not None
        assert response.json()["record_type"] == "prescription"
        assert response.json()["status"] == "uploaded"
        assert response.json()["image_expires_at"] is not None

    async def test_upload_record_invalid_type(self):
        # Given
        signup_data = {
            "email": "record2@example.com",
            "password": "Password123!",
            "name": "기록테스터2",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "record2@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.post(
                "/api/v1/records",
                data={"record_type": "invalid_type"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_upload_record_unauthorized(self):
        # Given & When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
            )

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
