from tortoise import fields, models


class NotificationSettings(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.OneToOneField("models.User", related_name="notification_settings")
    guide_complete_alarm = fields.BooleanField(default=True)
    ocr_complete_alarm = fields.BooleanField(default=True)
    system_alarm = fields.BooleanField(default=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "notification_settings"
