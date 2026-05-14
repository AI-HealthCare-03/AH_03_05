from enum import StrEnum
from tortoise import fields, models


class InputMethod(StrEnum):
    OCR = "ocr"
    MANUAL = "manual"


class ApiStatus(StrEnum):
    NOT_SEARCHED = "not_searched"
    SEARCHED = "searched"
    FAILED = "failed"
    SELECTED = "selected"


class ReviewStatus(StrEnum):
    REVIEW_REQUIRED = "review_required"
    REVIEWED = "reviewed"


class Medication(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="medications")
    record = fields.ForeignKeyField("models.MedicalRecord", related_name="medications")
    drug_ref_id = fields.BigIntField(null=True)  # DrugReference 모델 연결 전 임시
    drug_name = fields.CharField(max_length=255)
    ingredient_name = fields.CharField(max_length=255, null=True)
    manufacturer = fields.CharField(max_length=255, null=True)
    dosage = fields.CharField(max_length=100, null=True)
    frequency = fields.CharField(max_length=100, null=True)
    timing = fields.CharField(max_length=100, null=True)
    duration = fields.CharField(max_length=100, null=True)
    caution = fields.TextField(null=True)
    side_effect = fields.TextField(null=True)
    input_method = fields.CharEnumField(enum_type=InputMethod, default=InputMethod.OCR)
    api_status = fields.CharEnumField(enum_type=ApiStatus, default=ApiStatus.NOT_SEARCHED)
    review_status = fields.CharEnumField(enum_type=ReviewStatus, default=ReviewStatus.REVIEW_REQUIRED)
    is_verified = fields.BooleanField(default=False)
    ocr_confidence = fields.DecimalField(max_digits=5, decimal_places=4, null=True)
    api_fetched_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "medications"
