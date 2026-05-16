from datetime import datetime

from pydantic import Field

from app.dtos.base import BaseSerializerModel


class MedicalRecordUploadResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="record_id")
    record_type: str
    file_url: str | None = None
    status: str
    image_expires_at: datetime | None = None
    uploaded_at: datetime
