from unittest.mock import patch

from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.guides import Guide, GuideStatus
from app.models.medical_records import (
    InputMethod,
    MedicalRecord,
    RecordStatus,
    RecordType,
)
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
            "name": "가이드테스터",
            "consents": CONSENTS,
        },
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


async def _create_record(user_email: str) -> MedicalRecord:
    """테스트용 record 생성."""
    user = await User.get(email=user_email)
    return await MedicalRecord.create(
        user=user,
        record_type=RecordType.PRESCRIPTION,
        status=RecordStatus.OCR_COMPLETED,
        input_method=InputMethod.UPLOAD,
    )


# 정훈님 generate_guide 정상 응답 가짜 데이터
MOCK_LLM_RESULT = {
    "medication_guide": "복약 안내 본문입니다.",
    "lifestyle_guide": "생활습관 가이드 본문입니다.",
    "warning_message": None,
    "disclaimer": "본 안내는 의료 진단을 대체하지 않아요.",
    "safety_flag": False,
    "guide_items": [
        {
            "item_type": "MEDICATION",
            "title": "복용 방법",
            "content": "식후 30분에 복용해주세요.",
            "sort_order": 1,
            "guideline_source_id": None,
        },
        {
            "item_type": "LIFESTYLE",
            "title": "식이 관리",
            "content": "저염식을 권장합니다.",
            "sort_order": 2,
            "guideline_source_id": None,
        },
    ],
}


class TestGuideGenerateAPI(TestCase):
    async def test_generate_without_auth_returns_401(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/guides/generate",
                json={"record_id": 1},
            )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_generate_other_user_record_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await _signup_and_login(client, "guide_a@example.com")
            record_a = await _create_record("guide_a@example.com")

            headers_b = await _signup_and_login(client, "guide_b@example.com")
            response = await client.post(
                "/api/v1/guides/generate",
                json={"record_id": record_a.id},
                headers=headers_b,
            )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch("app.services.guides.generate_guide", return_value=MOCK_LLM_RESULT)
    async def test_generate_success_returns_200(self, _mock_llm):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "guide_ok@example.com")
            record = await _create_record("guide_ok@example.com")

            response = await client.post(
                "/api/v1/guides/generate",
                json={"record_id": record.id},
                headers=headers,
            )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["status"] == "COMPLETED"
        assert body["guide_id"] is not None
        assert body["medication_guide"] == "복약 안내 본문입니다."
        assert body["lifestyle_guide"] == "생활습관 가이드 본문입니다."
        assert body["data_source"]["type"] == "REALTIME"
        assert len(body["guide_items"]) == 2

        # DB에 Guide 저장 확인
        guide = await Guide.get(id=body["guide_id"])
        assert guide.status == GuideStatus.COMPLETED

    @patch("app.services.guides.generate_guide", side_effect=Exception("LLM 호출 실패"))
    async def test_generate_llm_failure_returns_failed_status(self, _mock_llm):
        """LLM 호출 실패 시 Guide.status=FAILED + 200 응답 (라우터 200, body status FAILED)."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "guide_fail@example.com")
            record = await _create_record("guide_fail@example.com")

            response = await client.post(
                "/api/v1/guides/generate",
                json={"record_id": record.id},
                headers=headers,
            )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["status"] == "FAILED"
        assert body["guide_id"] is not None

        guide = await Guide.get(id=body["guide_id"])
        assert guide.status == GuideStatus.FAILED
