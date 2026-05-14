from enum import StrEnum
from tortoise import fields, models


class LineType(StrEnum):
    DRUG_NAME = "drug_name"
    DOSAGE = "dosage"
    FREQUENCY = "frequency"
    TIMING = "timing"
    CAUTION = "caution"
    OTHER = "other"


class OcrLine(models.Model):
    id = fields.BigIntField(primary_key=True)
    medical_record = fields.ForeignKeyField("models.MedicalRecord", related_name="ocr_lines")
    line_number = fields.IntField()
    text = fields.TextField()
    confidence = fields.DecimalField(max_digits=5, decimal_places=4, null=True)
    line_type = fields.CharEnumField(enum_type=LineType, null=True)
    is_edited = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "ocr_lines"
