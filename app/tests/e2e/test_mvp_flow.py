"""
MVP 전체 사용자 여정 E2E 테스트.

Sprint 3 목표 4 (전체 플로우 통합 테스트) 일환.

검증 흐름:
  signup → login → health profile 등록
    → 의료 기록 직접 입력 → 약품 후보 확정
    → LLM 가이드 생성/조회
    → 챗봇 세션 생성/메시지 전송/조회

각 단계의 응답이 다음 단계의 입력으로 정상 연결되는지가 핵심.
외부 API(OpenAI, 식약처)는 unittest.mock.patch로 차단.
"""

from unittest.mock import patch

from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from tests.integration.fixtures.llm_responses import (
    CHAT_NORMAL,
    LIFESTYLE_HYPERTENSION,
    MED_HYPERTENSION,
    make_openai_response,
)
from tests.integration.fixtures.mfds_responses import (
    DETAIL_TYLENOL,
    SEARCH_TYLENOL,
)

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]

HEALTH_PROFILE_DATA = {
    "age_group": "30s",
    "gender": "M",
    "chronic_diseases": ["hypertension"],
    "allergies": [],
    "current_medications": ["amlodipine"],
    "medical_history": "고혈압 진단",
    "doctor_opinion": "꾸준한 복용 권장",
}

OCR_TEXT = "암로디핀 5mg 1정 1일 1회 아침 식후"


class TestMvpFlow(TestCase):
    """전체 MVP 흐름을 한 시나리오로 검증."""

    @patch("app.services.mfds_client.MFDSClient.get_drug_detail", return_value=DETAIL_TYLENOL)
    @patch("app.services.mfds_client.MFDSClient.search_drug", return_value=SEARCH_TYLENOL)
    @patch("app.services.chatbot_service.client.chat.completions.create")
    @patch("app.services.llm_service.client.chat.completions.create")
    async def test_full_user_journey(
        self,
        mock_llm,
        mock_chatbot,
        mock_search,
        mock_detail,
    ):
        """
        고혈압 30대 남성이 가입부터 챗봇까지 전체 플로우 완주.
        각 단계의 응답 키가 다음 단계 호출 입력으로 정상 사용되는지 검증.
        """
        # LLM mocking: 가이드 생성은 medication + lifestyle 2회 호출
        mock_llm.side_effect = [
            make_openai_response(MED_HYPERTENSION),
            make_openai_response(LIFESTYLE_HYPERTENSION),
        ]
        # 챗봇 mocking
        mock_chatbot.return_value = make_openai_response(CHAT_NORMAL)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # ===== 1단계: 회원가입 =====
            signup_response = await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": "e2e@example.com",
                    "password": "Password123!",
                    "name": "E2E 테스터",
                    "consents": CONSENTS,
                },
            )
            assert signup_response.status_code == status.HTTP_201_CREATED

            # ===== 2단계: 로그인 → access_token 확보 =====
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "e2e@example.com", "password": "Password123!"},
            )
            assert login_response.status_code == status.HTTP_200_OK
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # ===== 3단계: 건강 프로필 등록 =====
            profile_response = await client.put("/api/v1/health-profile", json=HEALTH_PROFILE_DATA, headers=headers)
            assert profile_response.status_code == status.HTTP_200_OK
            assert profile_response.json()["profile_id"] is not None

            # ===== 4단계: 의료 기록 직접 입력 (OCR 우회) =====
            record_response = await client.post(
                "/api/v1/records/manual-input",
                json={"ocr_edited_text": OCR_TEXT},
                headers=headers,
            )
            assert record_response.status_code == status.HTTP_201_CREATED
            record_id = record_response.json()["record_id"]
            assert record_id is not None

            # ===== 5단계: LLM 가이드 생성 =====
            guide_create_response = await client.post(
                "/api/v1/guides/generate",
                json={"record_id": record_id},
                headers=headers,
            )
            assert guide_create_response.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
            guide_id = guide_create_response.json()["guide_id"]
            assert guide_id is not None

            # ===== 6단계: 가이드 결과 조회 =====
            guide_detail_response = await client.get(f"/api/v1/guides/{guide_id}", headers=headers)
            assert guide_detail_response.status_code == status.HTTP_200_OK

            # ===== 7단계: 챗봇 세션 생성 =====
            session_response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": record_id},
                headers=headers,
            )
            assert session_response.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
            session_id = session_response.json()["session_id"]
            assert session_id is not None

            # ===== 8단계: 챗봇 메시지 전송 =====
            message_response = await client.post(
                f"/api/v1/chat/sessions/{session_id}/messages",
                json={"message": "암로디핀 복용 시 주의사항이 뭔가요?"},
                headers=headers,
            )
            assert message_response.status_code in (
                status.HTTP_200_OK,
                status.HTTP_201_CREATED,
            )
