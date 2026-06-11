from datetime import UTC, datetime

from app.models.notifications import Notification
from app.models.users import User


class NotificationService:
    async def get_notifications(
        self,
        user: User,
        page: int = 1,
        size: int = 20,
        is_read: bool | None = None,
    ) -> tuple[list[Notification], int, int]:
        query = Notification.filter(user=user)
        if is_read is not None:
            query = query.filter(is_read=is_read)
        total = await query.count()
        notifications = await query.order_by("-created_at").offset((page - 1) * size).limit(size)
        unread_count = await self.get_unread_count(user)
        return notifications, unread_count, total

    async def get_unread_count(self, user: User) -> int:
        return await Notification.filter(user=user, is_read=False).count()

    async def read_notification(self, user: User, notification_id: int) -> Notification | None:
        notification = await Notification.get_or_none(id=notification_id, user=user)
        if notification is None:
            return None
        if not notification.is_read:
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

    async def read_all_notifications(self, user: User) -> int:
        updated_count = await Notification.filter(user=user, is_read=False).update(
            is_read=True, read_at=datetime.now(UTC)
        )
        return updated_count
