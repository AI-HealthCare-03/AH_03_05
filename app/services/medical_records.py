from datetime import UTC, datetime, timedelta

from app.models.medical_records import InputMethod, MedicalRecord, RecordStatus, RecordType
from app.models.users import User

IMAGE_EXPIRES_DAYS = 90


class MedicalRecordService:
    async def upload_record(
        self,
        user: User,
        record_type: str,
        filename: str | None = None,
        content_type: str | None = None,
        file_size_bytes: int | None = None,
    ) -> MedicalRecord:
        image_expires_at = datetime.now(UTC) + timedelta(days=IMAGE_EXPIRES_DAYS)
        record = await MedicalRecord.create(
            user=user,
            record_type=RecordType(record_type),
            original_filename=filename,
            content_type=content_type,
            file_size_bytes=file_size_bytes,
            status=RecordStatus.UPLOADED,
            input_method=InputMethod.UPLOAD,
            image_expires_at=image_expires_at,
        )
        return record
