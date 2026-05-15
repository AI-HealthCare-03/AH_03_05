from enum import StrEnum

from tortoise import fields, models


class JobType(StrEnum):
    OCR = "ocr"
    GUIDE_GENERATION = "guide_generation"


class JobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


class ProcessingJob(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="processing_jobs")
    record = fields.ForeignKeyField("models.MedicalRecord", related_name="processing_jobs", null=True)
    job_type = fields.CharEnumField(enum_type=JobType)
    status = fields.CharEnumField(enum_type=JobStatus, default=JobStatus.PENDING)
    provider = fields.CharField(max_length=100, null=True)
    request_payload = fields.TextField(null=True)
    result_payload = fields.TextField(null=True)
    error_message = fields.TextField(null=True)
    timeout_seconds = fields.IntField(null=True)
    started_at = fields.DatetimeField(null=True)
    completed_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "processing_jobs"
