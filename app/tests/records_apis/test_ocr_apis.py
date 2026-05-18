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


class TestOcrAPI(TestCase):
    async def test_create_ocr_job_success(self):
        # Given
        signup_data = {
            "email": "ocr@example.com",
            "password": "Password123!",
            "name": "OCR테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "ocr@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            upload_response = await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )
            record_id = upload_response.json()["record_id"]

            # When
            response = await client.post(
                "/api/v1/ocr/jobs",
                json={"record_id": record_id},
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.json()["job_id"] is not None
        assert response.json()["record_id"] == record_id
        assert response.json()["job_type"] == "ocr"
        assert response.json()["status"] == "pending"

    async def test_get_processing_job_success(self):
        # Given
        signup_data = {
            "email": "ocr2@example.com",
            "password": "Password123!",
            "name": "OCR테스터2",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "ocr2@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            upload_response = await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )
            record_id = upload_response.json()["record_id"]
            job_response = await client.post(
                "/api/v1/ocr/jobs",
                json={"record_id": record_id},
                headers=headers,
            )
            job_id = job_response.json()["job_id"]

            # When
            response = await client.get(f"/api/v1/processing-jobs/{job_id}", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["job_id"] == job_id
        assert response.json()["status"] == "pending"

    async def test_get_ocr_result_success(self):
        # Given
        signup_data = {
            "email": "ocr3@example.com",
            "password": "Password123!",
            "name": "OCR테스터3",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "ocr3@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            upload_response = await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )
            record_id = upload_response.json()["record_id"]

            # When
            response = await client.get(f"/api/v1/records/{record_id}/ocr-result", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["record_id"] == record_id
        assert response.json()["medication_candidates"] == []

    async def test_update_ocr_text_success(self):
        # Given
        signup_data = {
            "email": "ocr4@example.com",
            "password": "Password123!",
            "name": "OCR테스터4",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "ocr4@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            upload_response = await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )
            record_id = upload_response.json()["record_id"]

            # When
            response = await client.patch(
                f"/api/v1/records/{record_id}/ocr-text",
                json={"ocr_edited_text": "타이레놀 500mg 1정 식후 복용"},
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["record_id"] == record_id
        assert response.json()["status"] == "ocr_completed"
        assert response.json()["updated_at"] is not None
