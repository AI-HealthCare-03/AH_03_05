from datetime import datetime

from pydantic import BaseModel


class ConsentItemResponse(BaseModel):
    consent_type: str
    required_type: str
    is_agreed: bool
    agreed_at: datetime | None = None
    revoked_at: datetime | None = None


class ConsentListResponse(BaseModel):
    consents: list[ConsentItemResponse]


class ConsentToggleRequest(BaseModel):
    is_agreed: bool


class ConsentToggleResponse(BaseModel):
    consent_type: str
    required_type: str
    is_agreed: bool
    agreed_at: datetime | None = None
    revoked_at: datetime | None = None
