from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.models.medical_records import MedicalRecord

scheduler = AsyncIOScheduler()

EXPIRY_DAYS = 90


async def delete_expired_records() -> None:
    """
    소프트딜리트 후 30일이 경과한 진료기록을 영구 삭제한다.
    매일 자정에 실행.
    """
    threshold = datetime.now(UTC) - timedelta(days=EXPIRY_DAYS)
    expired = await MedicalRecord.filter(
        deleted_at__isnull=False,
        deleted_at__lt=threshold,
    ).all()

    count = len(expired)
    for record in expired:
        await record.delete()

    if count:
        print(f"[scheduler] 만료 진료기록 {count}건 영구 삭제 완료")


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
