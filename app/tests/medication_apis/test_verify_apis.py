from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.medical_records import (
    InputMethod,
    MedicalRecord,
    RecordStatus,
    RecordType,
)
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
    """회원가입 + 로그인 후 Bearer 헤더 반환."""
    await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "name": "확정테스터",
            "consents": CONSENTS,
        },
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


async def _create_record_with_medications(
    user_email: str,
    status_value: RecordStatus = RecordStatus.OCR_COMPLETED,
    num_medications: int = 2,
) -> tuple[MedicalRecord, list[Medication]]:
    """테스트용 record + medication 직접 생성 (OCR 거치지 않고)."""
    user = await User.get(email=user_email)
    record = await MedicalRecord.create(
        user=user,
        record_type=RecordType.PRESCRIPTION,
        status=status_value,
        input_method=InputMethod.UPLOAD,
    )
    medications = []
    for i in range(num_medications):
        med = await Medication.create(
            user=user,
            record=record,
            drug_name=f"테스트약품{i + 1}",
        )
        medications.append(med)
    return record, medications


class TestMedicationVerifyAPI(TestCase):
    async def test_verify_without_auth_returns_401(self):
        """토큰 없이 호출 시 401."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/records/1/medications/verify",
                json={"verifications": [{"medication_id": 1}]},
            )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_verify_other_user_record_returns_404(self):
        """다른 사용자의 record로 호출 시 404."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # user A: record + medication 생성
            await _signup_and_login(client, "verify_a@example.com")
            record_a, meds_a = await _create_record_with_medications("verify_a@example.com")

            # user B: 로그인 후 user A의 record로 verify 시도
            headers_b = await _signup_and_login(client, "verify_b@example.com")
            response = await client.post(
                f"/api/v1/records/{record_a.id}/medications/verify",
                json={
                    "verifications": [{"medication_id": meds_a[0].id}],
                },
                headers=headers_b,
            )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_verify_wrong_record_status_returns_400(self):
        """record 상태가 ocr_completed가 아닐 때 400."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "verify_status@example.com")
            record, meds = await _create_record_with_medications(
                "verify_status@example.com",
                status_value=RecordStatus.UPLOADED,  # ocr 전 상태
            )
            response = await client.post(
                f"/api/v1/records/{record.id}/medications/verify",
                json={"verifications": [{"medication_id": meds[0].id}]},
                headers=headers,
            )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_verify_medication_not_in_record_returns_400(self):
        """다른 record에 속한 medication_id를 보내면 400."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "verify_mix@example.com")
            record1, meds1 = await _create_record_with_medications("verify_mix@example.com")
            record2, meds2 = await _create_record_with_medications("verify_mix@example.com")

            # record1로 호출하면서 record2의 medication_id를 전달
            response = await client.post(
                f"/api/v1/records/{record1.id}/medications/verify",
                json={"verifications": [{"medication_id": meds2[0].id}]},
                headers=headers,
            )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_verify_success_returns_200(self):
        """정상 확정 시 200 + medication 상태 업데이트 확인."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "verify_ok@example.com")
            record, meds = await _create_record_with_medications("verify_ok@example.com", num_medications=2)

            # 첫 번째 medication만 확정 (drug_ref_id 없이)
            response = await client.post(
                f"/api/v1/records/{record.id}/medications/verify",
                json={"verifications": [{"medication_id": meds[0].id}]},
                headers=headers,
            )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["record_id"] == record.id
        assert body["verified_count"] == 1
        assert body["total_count"] == 2
        assert len(body["medications"]) == 1
        assert body["medications"][0]["medication_id"] == meds[0].id
        assert body["medications"][0]["is_verified"] is True
        assert body["medications"][0]["review_status"] == "reviewed"
        assert body["medications"][0]["api_status"] == "selected"

        # DB에서도 실제 업데이트 확인
        updated = await Medication.get(id=meds[0].id)
        assert updated.is_verified is True
