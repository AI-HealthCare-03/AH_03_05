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

    async def test_get_records_success(self):
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
            await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )

            # When
            response = await client.get("/api/v1/records", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()["items"]) == 1
        assert response.json()["items"][0]["record_type"] == "prescription"
        assert response.json()["page"] == 1

    async def test_get_record_detail_success(self):
        # Given
        signup_data = {
            "email": "record3@example.com",
            "password": "Password123!",
            "name": "기록테스터3",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "record3@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            upload_response = await client.post(
                "/api/v1/records",
                data={"record_type": "medicine_bag"},
                files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                headers=headers,
            )
            record_id = upload_response.json()["record_id"]

            # When
            response = await client.get(f"/api/v1/records/{record_id}", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["record_id"] == record_id
        assert response.json()["record_type"] == "medicine_bag"
        assert response.json()["status"] == "uploaded"

    async def test_get_record_detail_not_found(self):
        # Given
        signup_data = {
            "email": "record4@example.com",
            "password": "Password123!",
            "name": "기록테스터4",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "record4@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.get("/api/v1/records/99999", headers=headers)

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_upload_record_invalid_type(self):
        # Given
        signup_data = {
            "email": "record5@example.com",
            "password": "Password123!",
            "name": "기록테스터5",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "record5@example.com", "password": "Password123!"},
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

    async def test_manual_input_success(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": "manual1@example.com",
                    "password": "Password123!",
                    "name": "직접입력테스터",
                    "consents": CONSENTS,
                },
            )
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "manual1@example.com", "password": "Password123!"},
            )
            headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

            # When
            response = await client.post(
                "/api/v1/records/manual-input",
                json={"ocr_edited_text": "타이레놀 500mg 1정 식후 복용"},
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["record_id"] is not None
        assert response.json()["input_method"] == "manual"
        assert response.json()["status"] == "ocr_completed"

    async def test_manual_input_unauthorized(self):
        # Given & When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/records/manual-input",
                json={"ocr_edited_text": "타이레놀 500mg 1정 식후 복용"},
            )

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_records_filter_by_record_type(self):
        """record_type 필터 적용 분기 검증 (services/medical_records.py 41)"""
        signup_data = {
            "email": "record_filter@example.com",
            "password": "Password123!",
            "name": "필터테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "record_filter@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            await client.post(
                "/api/v1/records",
                data={"record_type": "prescription"},
                files={"file": ("test.txt", BytesIO(b"test"), "text/plain")},
                headers=headers,
            )

            response = await client.get(
                "/api/v1/records?record_type=prescription",
                headers=headers,
            )

            assert response.status_code == status.HTTP_200_OK

    async def test_get_record_not_found(self):
        """존재하지 않는 record_id 조회 (services/medical_records.py 52)"""
        signup_data = {
            "email": "record_notfound@example.com",
            "password": "Password123!",
            "name": "404테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "record_notfound@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            response = await client.get("/api/v1/records/99999", headers=headers)

            assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_ocr_result_not_found(self):
        """존재하지 않는 record_id로 OCR 조회 (services/medical_records.py 74)"""
        signup_data = {
            "email": "ocr_notfound@example.com",
            "password": "Password123!",
            "name": "OCR404테스터",
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

            response = await client.get("/api/v1/records/99999/ocr", headers=headers)

            assert response.status_code == status.HTTP_404_NOT_FOUND
