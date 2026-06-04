from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.medical_records import MedicalRecord, RecordStatus, RecordType
from app.models.medications import Medication
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
        json={"email": email, "password": "Password123!", "name": "약품목록테스터", "consents": CONSENTS},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


class TestRecordMedicationsAPI(TestCase):
    async def test_list_success(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "rm_ok@test.com")
            user = await User.get(email="rm_ok@test.com")
            record = await MedicalRecord.create(
                user=user, record_type=RecordType.PRESCRIPTION, status=RecordStatus.OCR_COMPLETED
            )
            await Medication.create(
                user=user, record=record, drug_name="타이레놀", dosage="1정", frequency="1일 3회", is_verified=True
            )
            await Medication.create(user=user, record=record, drug_name="아목시실린")
            response = await client.get(f"/api/v1/records/{record.id}/medications", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["record_id"] == record.id
        meds = data["medications"]
        assert len(meds) == 2
        assert {m["drug_name"] for m in meds} == {"타이레놀", "아목시실린"}
        assert "medication_id" in meds[0]

    async def test_unknown_record_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "rm_404@test.com")
            response = await client.get("/api/v1/records/99999/medications", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_unauthorized(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/records/1/medications")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
