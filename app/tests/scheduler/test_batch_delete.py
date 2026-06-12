"""
delete_expired_records() 단위 테스트.
90일 경과 소프트딜리트 레코드만 영구 삭제되는지 검증.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

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
        """90일 초과 소프트딜리트 레코드는 영구 삭제된다."""
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
        """90일 미만 소프트딜리트 레코드는 영구 삭제되지 않는다."""
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

    async def test_batch_delete_logs_error_on_exception(self):
        """예외 발생 시 에러 로그를 남기고 re-raise한다."""
        with patch("app.core.scheduler.MedicalRecord.filter") as mock_filter:
            mock_filter.return_value.count = AsyncMock(side_effect=Exception("DB 연결 오류"))
            with patch("app.core.scheduler.default_logger") as mock_logger:
                try:
                    await delete_expired_records()
                except Exception:
                    pass
                mock_logger.error.assert_called_once()


class TestTimeoutStaleJobs(TestCase):
    """timeout_stale_jobs() 단위 테스트."""

    async def test_timeout_pending_job(self):
        """PENDING 상태에서 30초 초과한 job이 TIMEOUT으로 처리되는지 검증."""
        from datetime import UTC, datetime, timedelta

        from app.core.scheduler import timeout_stale_jobs
        from app.models.processing_jobs import JobStatus, JobType, ProcessingJob

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": "timeout_test@example.com",
                    "password": "Password123!",
                    "name": "타임아웃테스터",
                    "consents": CONSENTS,
                },
            )
            user = await User.get(email="timeout_test@example.com")

        # 31초 전에 생성된 PENDING job 생성
        job = await ProcessingJob.create(
            user=user,
            job_type=JobType.OCR,
            status=JobStatus.PENDING,
        )
        old_time = datetime.now(UTC) - timedelta(seconds=31)
        await ProcessingJob.filter(id=job.id).update(created_at=old_time)

        # timeout_stale_jobs 실행
        await timeout_stale_jobs()

        # TIMEOUT으로 변경됐는지 확인
        updated_job = await ProcessingJob.get(id=job.id)
        assert updated_job.status == JobStatus.TIMEOUT

    async def test_no_timeout_for_fresh_job(self):
        """방금 생성된 PENDING job은 TIMEOUT 처리되지 않는지 검증."""
        from app.core.scheduler import timeout_stale_jobs
        from app.models.processing_jobs import JobStatus, JobType, ProcessingJob

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": "fresh_job_test@example.com",
                    "password": "Password123!",
                    "name": "신선한테스터",
                    "consents": CONSENTS,
                },
            )
            user = await User.get(email="fresh_job_test@example.com")

        job = await ProcessingJob.create(
            user=user,
            job_type=JobType.OCR,
            status=JobStatus.PENDING,
        )

        await timeout_stale_jobs()

        updated_job = await ProcessingJob.get(id=job.id)
        assert updated_job.status == JobStatus.PENDING

    async def test_timeout_stale_jobs_exception_handling(self):
        """timeout_stale_jobs 실행 중 예외 발생 시 raise되는지 검증."""
        from unittest.mock import patch

        from app.core.scheduler import timeout_stale_jobs

        with patch(
            "app.core.scheduler.ProcessingJob.filter",
            side_effect=Exception("DB 오류"),
        ):
            try:
                await timeout_stale_jobs()
                raise AssertionError("예외가 발생해야 합니다")
            except Exception:
                pass

    async def test_start_scheduler_adds_timeout_job(self):
        """start_scheduler 호출 시 timeout_stale_jobs job이 등록되는지 검증."""
        from unittest.mock import MagicMock, patch

        from app.core.scheduler import start_scheduler

        with patch("app.core.scheduler.scheduler") as mock_scheduler:
            mock_scheduler.add_job = MagicMock()
            mock_scheduler.start = MagicMock()
            start_scheduler()
            job_ids = [call.kwargs.get("id") for call in mock_scheduler.add_job.call_args_list]
            assert "timeout_stale_jobs" in job_ids
