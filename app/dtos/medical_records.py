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
    file_url: str | None = None
    original_filename: str | None = Field(default=None, serialization_alias="file_name")
    content_type: str | None = None
    file_size_bytes: int | None = Field(default=None, serialization_alias="file_size")
    ocr_text: str | None = None
    ocr_edited_text: str | None = None
    ocr_confidence: float | None = None
    input_method: str | None = None
    image_expires_at: datetime | None = None
    uploaded_at: datetime | None = None
    updated_at: datetime | None = None


class ManualInputRequest(BaseModel):
    record_type: str = "manual"
    ocr_edited_text: str


class ManualInputResponse(BaseModel):
    record_id: int
    input_method: str
    status: str
