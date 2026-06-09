from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.core.validators.user_validators import validate_password


class ConsentItem(BaseModel):
    consent_type: str
    is_agreed: bool


class SignUpRequest(BaseModel):
    email: Annotated[EmailStr, Field(max_length=100)]
    password: Annotated[str, Field(min_length=8, max_length=20)]
    name: Annotated[str, Field(min_length=2, max_length=20, pattern=r"^[가-힣a-zA-Z0-9\s]+$")]
    nickname: Annotated[str | None, Field(max_length=100)] = None
    consents: list[ConsentItem]

    @field_validator("password")
    @classmethod
    def password_policy(cls, v: str) -> str:
        validate_password(v)
        return v

    @model_validator(mode="after")
    def password_not_similar_to_personal_info(self) -> "SignUpRequest":
        password = self.password or ""
        email_local = str(self.email).split("@")[0].lower() if self.email else ""
        name = self.name or ""
        if email_local and email_local in password.lower():
            raise ValueError("비밀번호에 이메일 주소를 포함할 수 없습니다.")
        if name and name.lower() in password.lower():
            raise ValueError("비밀번호에 이름을 포함할 수 없습니다.")
        return self


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


class EmailVerifySendRequest(BaseModel):
    email: EmailStr


class EmailVerifySendResponse(BaseModel):
    detail: str
    retry_after: int | None = None


class EmailVerifyConfirmRequest(BaseModel):
    email: EmailStr
    code: str


class EmailVerifyConfirmResponse(BaseModel):
    detail: str
