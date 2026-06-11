from datetime import datetime

from pydantic import BaseModel, Field

from app.dtos.base import BaseSerializerModel


class NotificationItem(BaseSerializerModel):
    id: int = Field(serialization_alias="notification_id")
    notification_type: str
    title: str
    message: str
    is_read: bool
    related_url: str | None = None
    created_at: datetime
    read_at: datetime | None = None


class NotificationListResponse(BaseModel):
    items: list[NotificationItem]
    unread_count: int
    total: int
    page: int
    size: int


class NotificationReadResponse(BaseModel):
    notification_id: int
    is_read: bool
    read_at: datetime


class NotificationDeleteResponse(BaseModel):
    detail: str


class UnreadCountResponse(BaseModel):
    unread_count: int


class ReadAllNotificationsResponse(BaseModel):
    updated_count: int
