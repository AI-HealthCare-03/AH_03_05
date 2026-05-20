from datetime import UTC, datetime

from app.models.notifications import Notification
from app.models.users import User


class NotificationService:
    async def get_notifications(self, user: User) -> tuple[list[Notification], int]:
        notifications = await Notification.filter(user=user).order_by("-created_at")
        unread_count = await self.get_unread_count(user)
        return notifications, unread_count

    async def get_unread_count(self, user: User) -> int:
        return await Notification.filter(user=user, is_read=False).count()

    async def read_notification(self, user: User, notification_id: int) -> Notification | None:
        notification = await Notification.get_or_none(id=notification_id, user=user)
        if notification is None:
            return None
        notification.is_read = True
        notification.read_at = datetime.now(UTC)
        await notification.save()
        return notification

    async def delete_notification(self, user: User, notification_id: int) -> bool:
        notification = await Notification.get_or_none(id=notification_id, user=user)
        if notification is None:
            return False
        await notification.delete()
        return True
