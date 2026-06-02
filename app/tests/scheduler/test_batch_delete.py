"""
delete_expired_records() 단위 테스트.
30일 경과 소프트딜리트 레코드만 영구 삭제되는지 검증.
"""

from datetime import UTC, datetime, timedelta

from httpx import ASGITransport, AsyncClient
from tortoise.contrib.test import TestCase

from app.core.scheduler import EXPIRY_DAYS, delete_expired_records
from app.main import app
from app.models.medical_records import InputMethod, MedicalRecord, RecordStatus, RecordType
from app.models.users import User

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def _create_user(email: str) -> User:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post(
            "/api/v1/auth/signup",
            json={
                "email": email,
                "password": "Password123!",
                "name": "배치테스터",
                "consents": CONSENTS,
            },
        )
    return await User.get(email=email)


class TestBatchDeleteExpiredRecords(TestCase):
    async def test_expired_record_is_deleted(self):
        """30일 초과 소프트딜리트 레코드는 영구 삭제된다."""
        user = await _create_user("batch_expired@example.com")
        record = await MedicalRecord.create(
            user=user,
            record_type=RecordType.PRESCRIPTION,
            status=RecordStatus.OCR_COMPLETED,
            input_method=InputMethod.UPLOAD,
            deleted_at=datetime.now(UTC) - timedelta(days=EXPIRY_DAYS + 1),
        )

        await delete_expired_records()

        result = await MedicalRecord.get_or_none(id=record.id)
        assert result is None

    async def test_recent_deleted_record_is_not_deleted(self):
        """30일 미만 소프트딜리트 레코드는 영구 삭제되지 않는다."""
        user = await _create_user("batch_recent@example.com")
        record = await MedicalRecord.create(
            user=user,
            record_type=RecordType.PRESCRIPTION,
            status=RecordStatus.OCR_COMPLETED,
            input_method=InputMethod.UPLOAD,
            deleted_at=datetime.now(UTC) - timedelta(days=EXPIRY_DAYS - 1),
        )

        await delete_expired_records()

        result = await MedicalRecord.get_or_none(id=record.id)
        assert result is not None

    async def test_active_record_is_not_deleted(self):
        """삭제되지 않은 활성 레코드는 영구 삭제되지 않는다."""
        user = await _create_user("batch_active@example.com")
        record = await MedicalRecord.create(
            user=user,
            record_type=RecordType.PRESCRIPTION,
            status=RecordStatus.OCR_COMPLETED,
            input_method=InputMethod.UPLOAD,
            deleted_at=None,
        )

        await delete_expired_records()

        result = await MedicalRecord.get_or_none(id=record.id)
        assert result is not None
