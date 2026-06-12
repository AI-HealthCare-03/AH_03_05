from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.core.logger import default_logger
from app.models.medical_records import MedicalRecord
from app.models.processing_jobs import JobStatus, ProcessingJob

scheduler = AsyncIOScheduler()

EXPIRY_DAYS = 90


async def delete_expired_records() -> None:
    """
    소프트딜리트 후 90일이 경과한 진료기록을 영구 삭제한다.
    매일 자정에 실행.
    """
    try:
        threshold = datetime.now(UTC) - timedelta(days=EXPIRY_DAYS)
        count = await MedicalRecord.filter(
            deleted_at__isnull=False,
            deleted_at__lt=threshold,
        ).count()
        await MedicalRecord.filter(
            deleted_at__isnull=False,
            deleted_at__lt=threshold,
        ).delete()
        if count:
            default_logger.info("[scheduler] 만료 진료기록 %d건 영구 삭제 완료", count)
    except Exception as e:
        default_logger.error("[scheduler] 배치 실패: %s", str(e))
        raise


DEFAULT_TIMEOUT_SECONDS = 30


async def timeout_stale_jobs() -> None:
    """
    PENDING/RUNNING 상태에서 timeout_seconds 이상 경과한 job을 TIMEOUT으로 처리.
    1분마다 실행.
    """
    try:
        now = datetime.now(UTC)
        jobs = await ProcessingJob.filter(
            status__in=[JobStatus.PENDING, JobStatus.RUNNING],
        ).all()
        timeout_count = 0
        for job in jobs:
            timeout_sec = job.timeout_seconds or DEFAULT_TIMEOUT_SECONDS
            elapsed = (now - job.created_at).total_seconds()
            if elapsed > timeout_sec:
                await ProcessingJob.filter(id=job.id).update(
                    status=JobStatus.TIMEOUT,
                    error_message=f"처리 시간 초과 ({timeout_sec}초)",
                )
                timeout_count += 1
        if timeout_count:
            default_logger.info("[scheduler] 타임아웃 처리 %d건 완료", timeout_count)
    except Exception as e:
        default_logger.error("[scheduler] 타임아웃 배치 실패: %s", str(e))
        raise


def start_scheduler() -> None:
    scheduler.add_job(
        delete_expired_records,
        trigger=CronTrigger(hour=0, minute=0, timezone="Asia/Seoul"),
        id="delete_expired_records",
        replace_existing=True,
    )
    scheduler.add_job(
        timeout_stale_jobs,
        trigger=IntervalTrigger(minutes=1),
        id="timeout_stale_jobs",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown()
