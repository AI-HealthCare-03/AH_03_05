import re
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from app.core.validators.user_validators import validate_password
from app.dtos.base import BaseSerializerModel

NICKNAME_PATTERN = re.compile(r"^[가-힣a-zA-Z0-9]{2,20}$")


class UserUpdateRequest(BaseModel):
    nickname: Annotated[str | None, Field(None, min_length=2, max_length=20)] = None

    @field_validator("nickname")
    @classmethod
    def nickname_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not NICKNAME_PATTERN.match(v):
            raise ValueError("2~20자, 한글/영문/숫자만 가능합니다.")
        return v


class UserInfoResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="user_id")
    email: str
    name: str
    nickname: str | None
    status: str
    last_login_at: datetime | None = None
    created_at: datetime


class UserUpdateResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="user_id")
    name: str
    nickname: str | None
    last_login_at: datetime | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: Annotated[str, Field(min_length=8, max_length=20)]

    @field_validator("new_password")
    @classmethod
    def new_password_policy(cls, v: str) -> str:
        return validate_password(v)


class PasswordChangeResponse(BaseModel):
    detail: str
    logout_all_devices: bool = True


class WithdrawRequest(BaseModel):
    password: str


class WithdrawResponse(BaseModel):
    detail: str
