from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.logger import default_logger
from app.models.medical_records import MedicalRecord

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


def start_scheduler() -> None:
    scheduler.add_job(
        delete_expired_records,
        trigger=CronTrigger(hour=0, minute=0, timezone="Asia/Seoul"),
        id="delete_expired_records",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown()
