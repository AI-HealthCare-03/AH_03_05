from app.models.medical_records import MedicalRecord
from app.models.processing_jobs import JobStatus, JobType, ProcessingJob
from app.models.users import User


class ProcessingJobService:
    async def create_ocr_job(
        self,
        user: User,
        record_id: int,
        provider: str | None = None,
    ) -> ProcessingJob | None:
        record = await MedicalRecord.get_or_none(id=record_id, user=user, deleted_at=None)
        if record is None:
            return None
        job = await ProcessingJob.create(
            user=user,
            record=record,
            job_type=JobType.OCR,
            status=JobStatus.PENDING,
            provider=provider,
        )
        return job

    async def get_job(self, user: User, job_id: int) -> ProcessingJob | None:
        return await ProcessingJob.get_or_none(id=job_id, user=user)
