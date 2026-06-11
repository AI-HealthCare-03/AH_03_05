from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.dependencies.security import get_request_user
from app.dtos.notifications import (
    NotificationDeleteResponse,
    NotificationItem,
    NotificationListResponse,
    NotificationReadResponse,
    ReadAllNotificationsResponse,
    UnreadCountResponse,
)
from app.exceptions.common import NotFoundException
from app.models.users import User
from app.services.notifications import NotificationService

notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])


@notifications_router.get("", response_model=NotificationListResponse, status_code=status.HTTP_200_OK)
async def get_notifications(
    user: Annotated[User, Depends(get_request_user)],
    notification_service: Annotated[NotificationService, Depends(NotificationService)],
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    is_read: bool | None = Query(None, description="읽음 여부 필터"),
) -> NotificationListResponse:
    notifications, unread_count, total = await notification_service.get_notifications(
        user, page=page, size=size, is_read=is_read
    )
    return NotificationListResponse(
        items=[NotificationItem.model_validate(n) for n in notifications],
        unread_count=unread_count,
        total=total,
        page=page,
        size=size,
    )


@notifications_router.get("/unread-count", response_model=UnreadCountResponse, status_code=status.HTTP_200_OK)
async def get_unread_count(
    user: Annotated[User, Depends(get_request_user)],
    notification_service: Annotated[NotificationService, Depends(NotificationService)],
) -> UnreadCountResponse:
    unread_count = await notification_service.get_unread_count(user)
    return UnreadCountResponse(unread_count=unread_count)


@notifications_router.patch("/read-all", response_model=ReadAllNotificationsResponse, status_code=status.HTTP_200_OK)
async def read_all_notifications(
    user: Annotated[User, Depends(get_request_user)],
    notification_service: Annotated[NotificationService, Depends(NotificationService)],
) -> ReadAllNotificationsResponse:
    updated_count = await notification_service.read_all_notifications(user)
    return ReadAllNotificationsResponse(updated_count=updated_count)


@notifications_router.patch(
    "/{notification_id}/read",
    response_model=NotificationReadResponse,
    status_code=status.HTTP_200_OK,
)
async def read_notification(
    notification_id: int,
    user: Annotated[User, Depends(get_request_user)],
    notification_service: Annotated[NotificationService, Depends(NotificationService)],
) -> NotificationReadResponse:
    notification = await notification_service.read_notification(user, notification_id)
    if notification is None:
        raise NotFoundException(detail="알림을 찾을 수 없습니다.")
    return NotificationReadResponse(
        notification_id=notification.id,
        is_read=notification.is_read,
        read_at=notification.read_at,
    )


@notifications_router.delete(
    "/{notification_id}",
    response_model=NotificationDeleteResponse,
    status_code=status.HTTP_200_OK,
)
async def delete_notification(
    notification_id: int,
    user: Annotated[User, Depends(get_request_user)],
    notification_service: Annotated[NotificationService, Depends(NotificationService)],
) -> NotificationDeleteResponse:
    result = await notification_service.delete_notification(user, notification_id)
    if not result:
        raise NotFoundException(detail="알림을 찾을 수 없습니다.")
    return NotificationDeleteResponse(detail="알림이 삭제되었습니다.")
