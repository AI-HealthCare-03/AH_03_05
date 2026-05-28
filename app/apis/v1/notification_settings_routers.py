from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies.security import get_request_user
from app.dtos.notification_settings import NotificationSettingsResponse, NotificationSettingsUpdate
from app.models.users import User
from app.services.notification_settings import NotificationSettingsService

notification_settings_router = APIRouter(prefix="/notification-settings", tags=["notification-settings"])


@notification_settings_router.put(
    "",
    response_model=NotificationSettingsResponse,
    status_code=status.HTTP_200_OK,
)
async def update_notification_settings(
    body: NotificationSettingsUpdate,
    user: Annotated[User, Depends(get_request_user)],
    notification_settings_service: Annotated[NotificationSettingsService, Depends(NotificationSettingsService)],
) -> NotificationSettingsResponse:
    settings = await notification_settings_service.upsert_notification_settings(user, body)
    return NotificationSettingsResponse.model_validate(settings)
