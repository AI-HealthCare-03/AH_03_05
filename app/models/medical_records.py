from enum import StrEnum

from tortoise import fields, models


class RecordType(StrEnum):
    PRESCRIPTION = "prescription"
    MEDICINE_BAG = "medicine_bag"


class RecordStatus(StrEnum):
    UPLOADED = "uploaded"
    OCR_PENDING = "ocr_pending"
    OCR_COMPLETED = "ocr_completed"
    OCR_FAILED = "ocr_failed"


class InputMethod(StrEnum):
    UPLOAD = "upload"
    MANUAL = "manual"


class MedicalRecord(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="medical_records")
    record_type = fields.CharEnumField(enum_type=RecordType)
    file_url = fields.CharField(max_length=500, null=True)
    original_filename = fields.CharField(max_length=255, null=True)
    content_type = fields.CharField(max_length=50, null=True)
    file_size_bytes = fields.BigIntField(null=True)
    ocr_text = fields.TextField(null=True)
    ocr_edited_text = fields.TextField(null=True)
    ocr_confidence = fields.DecimalField(max_digits=5, decimal_places=4, null=True)
    status = fields.CharEnumField(enum_type=RecordStatus, default=RecordStatus.UPLOADED)
    input_method = fields.CharEnumField(enum_type=InputMethod, default=InputMethod.UPLOAD)
    image_expires_at = fields.DatetimeField(null=True)
    uploaded_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    deleted_at = fields.DatetimeField(null=True)

    class Meta:
        table = "medical_records"
