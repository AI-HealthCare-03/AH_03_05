from enum import StrEnum

from tortoise import fields, models


class NotificationType(StrEnum):
    GUIDE_COMPLETED = "guide_completed"
    OCR_COMPLETED = "ocr_completed"
    OCR_FAILED = "ocr_failed"
    SYSTEM = "system"


class Notification(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="notifications")
    notification_type = fields.CharEnumField(enum_type=NotificationType)
    title = fields.CharField(max_length=255)
    message = fields.TextField()
    is_read = fields.BooleanField(default=False)
    related_job = fields.ForeignKeyField("models.ProcessingJob", related_name="notifications", null=True)
    related_url = fields.CharField(max_length=500, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    read_at = fields.DatetimeField(null=True)

    class Meta:
        table = "notifications"
