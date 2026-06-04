from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.medical_records import MedicalRecord, RecordStatus, RecordType
from app.models.users import User

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def _signup_and_login(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "name": "기록상세테스터",
            "consents": CONSENTS,
        },
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


class TestRecordDetailFieldsAPI(TestCase):
    async def test_detail_returns_file_fields_with_aliases(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "rdf_ok@test.com")
            user = await User.get(email="rdf_ok@test.com")
            record = await MedicalRecord.create(
                user=user,
                record_type=RecordType.PRESCRIPTION,
                file_url="https://example.com/rx.png",
                original_filename="처방전.png",
                content_type="image/png",
                file_size_bytes=12345,
                status=RecordStatus.OCR_COMPLETED,
            )
            response = await client.get(f"/api/v1/records/{record.id}", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["file_url"] == "https://example.com/rx.png"
        assert data["file_name"] == "처방전.png"
        assert data["file_size"] == 12345
        assert data["content_type"] == "image/png"
