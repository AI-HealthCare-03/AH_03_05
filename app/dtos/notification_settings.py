from datetime import datetime

from pydantic import BaseModel

from app.dtos.base import BaseSerializerModel


class NotificationSettingsUpdate(BaseModel):
    guide_complete_alarm: bool
    ocr_complete_alarm: bool
    system_alarm: bool


class NotificationSettingsResponse(BaseSerializerModel):
    guide_complete_alarm: bool
    ocr_complete_alarm: bool
    system_alarm: bool
    updated_at: datetime
