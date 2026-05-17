from datetime import UTC, datetime, timedelta

from app.models.medical_records import InputMethod, MedicalRecord, RecordStatus, RecordType
from app.models.medications import Medication
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

    async def get_records(
        self,
        user: User,
        page: int = 1,
        size: int = 10,
        record_type: str | None = None,
    ) -> tuple[list[MedicalRecord], int]:
        query = MedicalRecord.filter(user=user, deleted_at=None)
        if record_type:
            query = query.filter(record_type=record_type)
        total = await query.count()
        records = await query.order_by("-uploaded_at").offset((page - 1) * size).limit(size)
        return records, total

    async def get_record(self, user: User, record_id: int) -> MedicalRecord | None:
        return await MedicalRecord.get_or_none(id=record_id, user=user, deleted_at=None)

    async def get_ocr_result(self, user: User, record_id: int) -> dict | None:
        record = await MedicalRecord.get_or_none(id=record_id, user=user, deleted_at=None)
        if record is None:
            return None
        medications = await Medication.filter(record=record).all()
        candidates = [
            {
                "drug_name": m.drug_name,
                "confidence": float(m.ocr_confidence) if m.ocr_confidence else None,
                "is_verified": m.is_verified,
            }
            for m in medications
        ]
        return {
            "record_id": record.id,
            "ocr_text": record.ocr_text,
            "ocr_edited_text": record.ocr_edited_text,
            "ocr_confidence": float(record.ocr_confidence) if record.ocr_confidence else None,
            "medication_candidates": candidates,
        }

    async def update_ocr_text(self, user: User, record_id: int, ocr_edited_text: str) -> MedicalRecord | None:
        record = await MedicalRecord.get_or_none(id=record_id, user=user, deleted_at=None)
        if record is None:
            return None
        record.ocr_edited_text = ocr_edited_text
        record.status = RecordStatus.OCR_COMPLETED
        await record.save()
        return record
