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

    async def test_get_ocr_result_includes_manufacturer(self):
        # Given
        from app.models.medical_records import InputMethod, MedicalRecord, RecordStatus, RecordType
        from app.models.medications import Medication
        from app.models.users import User

        signup_data = {
            "email": "ocr5@example.com",
            "password": "Password123!",
            "name": "OCR테스터5",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "ocr5@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            user = await User.get(email="ocr5@example.com")
            record = await MedicalRecord.create(
                user=user,
                record_type=RecordType.PRESCRIPTION,
                status=RecordStatus.OCR_COMPLETED,
                input_method=InputMethod.UPLOAD,
            )
            await Medication.create(
                user=user,
                record=record,
                drug_name="타이레놀정500mg",
                manufacturer="한국얀센",
            )

            # When
            response = await client.get(f"/api/v1/records/{record.id}/ocr-result", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        candidates = response.json()["medication_candidates"]
        assert len(candidates) == 1
        assert candidates[0]["drug_name"] == "타이레놀정500mg"
        assert candidates[0]["manufacturer"] == "한국얀센"

    async def test_create_ocr_job_record_not_found(self):
        """존재하지 않는 record_id로 OCR job 생성 (services/processing_jobs.py 15)"""
        signup_data = {
            "email": "ocr_notfound@example.com",
            "password": "Password123!",
            "name": "OCRJob404",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "ocr_notfound@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            response = await client.post(
                "/api/v1/ocr/jobs",
                json={"record_id": 99999},
                headers=headers,
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND
