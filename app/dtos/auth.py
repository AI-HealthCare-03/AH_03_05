from typing import Annotated

from pydantic import BaseModel, EmailStr, Field


class ConsentItem(BaseModel):
    consent_type: str
    is_agreed: bool


class SignUpRequest(BaseModel):
    email: Annotated[EmailStr, Field(max_length=100)]
    password: Annotated[str, Field(min_length=8, max_length=20)]
    name: Annotated[str, Field(min_length=2, max_length=20)]
    nickname: Annotated[str | None, Field(max_length=100)] = None
    consents: list[ConsentItem]


class SignUpResponse(BaseModel):
    user_id: int
    email: str
    required_consents_saved: bool


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8)]


class UserInfo(BaseModel):
    id: int
    name: str
    nickname: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserInfo


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutRequest(BaseModel):
    refresh_token: str


class LogoutResponse(BaseModel):
    detail: str


class PasswordResetRequestRequest(BaseModel):
    email: str


class PasswordResetRequestResponse(BaseModel):
    detail: str


class PasswordResetConfirmRequest(BaseModel):
    email: str
    code: str
    new_password: str


class PasswordResetConfirmResponse(BaseModel):
    detail: str
