from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.dtos.base import BaseSerializerModel


class HealthProfileUpdateRequest(BaseModel):
    age_group: str | None = None
    gender: str | None = None
    chronic_diseases: list[Any] | None = None
    allergies: list[Any] | None = None
    current_medications: list[Any] | None = None
    medical_history: str | None = None
    doctor_opinion: str | None = None


class HealthProfileUpdateResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="profile_id")
    updated_at: datetime


class HealthProfileResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="profile_id")
    chronic_diseases: list[Any] | None = None
    allergies: list[Any] | None = None
    current_medications: list[Any] | None = None
