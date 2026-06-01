from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.medical_records import InputMethod, MedicalRecord, RecordStatus, RecordType
from app.models.medications import Medication
from app.models.users import User

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
        json={"email": email, "password": "Password123!"},
    )
    return login_response.json()["access_token"]


class TestMedicationDosageAPI(TestCase):
    async def test_update_dosage_success(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "dosage1@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            user = await User.get(email="dosage1@example.com")
            record = await MedicalRecord.create(
                user=user,
                record_type=RecordType.PRESCRIPTION,
                status=RecordStatus.OCR_COMPLETED,
                input_method=InputMethod.MANUAL,
            )
            medication = await Medication.create(
                user=user,
                record=record,
                drug_name="타이레놀 500mg",
            )

            # When
            response = await client.patch(
                f"/api/v1/medications/{medication.id}",
                json={
                    "dosage": "1정",
                    "frequency": "1일 3회",
                    "timing": "식후 30분",
                    "duration": "7일",
                },
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["medication_id"] == medication.id
        assert data["dosage"] == "1정"
        assert data["frequency"] == "1일 3회"
        assert data["timing"] == "식후 30분"
        assert data["duration"] == "7일"

    async def test_update_dosage_not_found(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "dosage2@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.patch(
                "/api/v1/medications/99999",
                json={"dosage": "1정"},
                headers=headers,
            )

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_update_dosage_unauthorized(self):
        # Given & When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                "/api/v1/medications/1",
                json={"dosage": "1정"},
            )

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
