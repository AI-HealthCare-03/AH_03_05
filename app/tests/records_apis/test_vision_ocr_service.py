from unittest.mock import AsyncMock, patch

from tortoise.contrib.test import TestCase

from app.models.medical_records import InputMethod, MedicalRecord, RecordStatus, RecordType
from app.models.medications import ApiStatus, Medication
from app.models.ocr_lines import LineType
from app.models.users import User
from app.services.vision_ocr_service import _create_medications_from_ocr

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def _create_test_user_and_record(email: str) -> tuple:
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post(
            "/api/v1/auth/signup",
            json={
                "email": email,
                "password": "Password123!",
                "name": "테스터",
                "consents": CONSENTS,
            },
        )

    user = await User.get(email=email)
    record = await MedicalRecord.create(
        user=user,
        record_type=RecordType.PRESCRIPTION,
        status=RecordStatus.OCR_COMPLETED,
        input_method=InputMethod.UPLOAD,
    )
    return user, record


class TestCreateMedicationsFromOcr(TestCase):
    async def test_mfds_search_success_creates_medication(self):
        """MFDS 검색 성공 시 Medication이 SEARCHED 상태로 생성된다"""
        # Given
        user, record = await _create_test_user_and_record("ocr_med1@example.com")
        lines = [
            {"text": "리바로젯정2/10밀리그램", "line_type": LineType.DRUG_NAME, "confidence": 0.95},
        ]
        mock_result = {
            "ITEM_NAME": "리바로젯정2/10밀리그램",
            "ENTP_NAME": "종근당",
            "ITEM_INGR_NAME": "피타바스타틴칼슘",
            "UD_DOC_DATA": None,
            "EE_DOC_DATA": None,
            "NB_DOC_DATA": None,
            "SIDE_EFFECT": None,
            "ITEM_SEQ": "123456",
        }

        with patch("app.services.vision_ocr_service.MFDSClient") as mock_client:
            mock_instance = mock_client.return_value
            mock_instance.search_drug = AsyncMock(return_value=[mock_result])

            # When
            await _create_medications_from_ocr(record, lines)

        # Then
        medications = await Medication.filter(record=record).all()
        assert len(medications) == 1
        assert medications[0].drug_name == "리바로젯정2/10밀리그램"
        assert medications[0].api_status == ApiStatus.SEARCHED
        assert medications[0].manufacturer == "종근당"

    async def test_mfds_search_no_result_saves_raw_text(self):
        """MFDS 검색 결과 없을 시 raw 텍스트로 FAILED 상태로 저장된다"""
        # Given
        user, record = await _create_test_user_and_record("ocr_med2@example.com")
        lines = [
            {"text": "알수없는약품명", "line_type": LineType.DRUG_NAME, "confidence": 0.80},
        ]

        with patch("app.services.vision_ocr_service.MFDSClient") as mock_client:
            mock_instance = mock_client.return_value
            mock_instance.search_drug = AsyncMock(return_value=[])

            # When
            await _create_medications_from_ocr(record, lines)

        # Then
        medications = await Medication.filter(record=record).all()
        assert len(medications) == 1
        assert medications[0].drug_name == "알수없는약품명"
        assert medications[0].api_status == ApiStatus.FAILED

    async def test_mfds_search_exception_saves_raw_text(self):
        """MFDS 검색 중 예외 발생 시 raw 텍스트로 FAILED 상태로 저장된다"""
        # Given
        user, record = await _create_test_user_and_record("ocr_med3@example.com")
        lines = [
            {"text": "타이레놀정500mg", "line_type": LineType.DRUG_NAME, "confidence": 0.90},
        ]

        with patch("app.services.vision_ocr_service.MFDSClient") as mock_client:
            mock_instance = mock_client.return_value
            mock_instance.search_drug = AsyncMock(side_effect=Exception("API 오류"))

            # When
            await _create_medications_from_ocr(record, lines)

        # Then
        medications = await Medication.filter(record=record).all()
        assert len(medications) == 1
        assert medications[0].drug_name == "타이레놀정500mg"
        assert medications[0].api_status == ApiStatus.FAILED

    async def test_no_drug_name_lines_creates_no_medication(self):
        """DRUG_NAME 라인이 없으면 Medication이 생성되지 않는다"""
        # Given
        user, record = await _create_test_user_and_record("ocr_med4@example.com")
        lines = [
            {"text": "1일 3회 식후 복용", "line_type": LineType.FREQUENCY, "confidence": 0.92},
            {"text": "주의사항 확인 필요", "line_type": LineType.CAUTION, "confidence": 0.88},
        ]

        with patch("app.services.vision_ocr_service.MFDSClient") as mock_client:
            mock_instance = mock_client.return_value
            mock_instance.search_drug = AsyncMock(return_value=[])

            # When
            await _create_medications_from_ocr(record, lines)

        # Then
        medications = await Medication.filter(record=record).all()
        assert len(medications) == 0
