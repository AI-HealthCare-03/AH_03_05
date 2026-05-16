from datetime import datetime

from pydantic import BaseModel, Field

from app.dtos.base import BaseSerializerModel


class MedicalRecordUploadResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="record_id")
    record_type: str
    file_url: str | None = None
    status: str
    image_expires_at: datetime | None = None
    uploaded_at: datetime


class MedicalRecordListItem(BaseSerializerModel):
    id: int = Field(serialization_alias="record_id")
    record_type: str
    status: str
    uploaded_at: datetime


class MedicalRecordListResponse(BaseModel):
    items: list[MedicalRecordListItem]
    page: int
    size: int


class MedicalRecordDetailResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="record_id")
    record_type: str
    status: str
    ocr_confidence: float | None = None
