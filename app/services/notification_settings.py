from app.dtos.notification_settings import NotificationSettingsUpdate
from app.models.notification_settings import NotificationSettings
from app.models.users import User


class NotificationSettingsService:
    async def upsert_notification_settings(self, user: User, data: NotificationSettingsUpdate) -> NotificationSettings:
        settings, _ = await NotificationSettings.get_or_create(user=user)
        settings.guide_complete_alarm = data.guide_complete_alarm
        settings.ocr_complete_alarm = data.ocr_complete_alarm
        settings.system_alarm = data.system_alarm
        await settings.save()
        return settings
