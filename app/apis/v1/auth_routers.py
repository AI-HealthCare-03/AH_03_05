from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dtos.auth import (
    EmailVerifyConfirmRequest,
    EmailVerifyConfirmResponse,
    EmailVerifySendRequest,
    EmailVerifySendResponse,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    LogoutResponse,
    PasswordResetConfirmRequest,
    PasswordResetConfirmResponse,
    PasswordResetRequestRequest,
    PasswordResetRequestResponse,
    SignUpRequest,
    SignUpResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserInfo,
)
from app.services.auth import AuthService

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignUpRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> SignUpResponse:
    user = await auth_service.signup(request)
    return SignUpResponse(
        user_id=user.id,
        email=user.email,
        required_consents_saved=True,
    )


@auth_router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    request: LoginRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> LoginResponse:
    user = await auth_service.authenticate(request)
    tokens = await auth_service.login(user)
    return LoginResponse(
        access_token=str(tokens["access_token"]),
        refresh_token=str(tokens["refresh_token"]),
        user=UserInfo(id=user.id, name=user.name, nickname=user.nickname),
    )


@auth_router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    request: LogoutRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> LogoutResponse:
    await auth_service.logout(request.refresh_token)
    return LogoutResponse(detail="로그아웃되었습니다.")


@auth_router.post("/refresh", response_model=TokenRefreshResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: TokenRefreshRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> TokenRefreshResponse:
    tokens = await auth_service.refresh(request.refresh_token)
    return TokenRefreshResponse(
        access_token=str(tokens["access_token"]),
        refresh_token=str(tokens["refresh_token"]),
    )


@auth_router.post(
    "/password-reset/request", response_model=PasswordResetRequestResponse, status_code=status.HTTP_200_OK
)
async def request_password_reset(
    request: PasswordResetRequestRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> PasswordResetRequestResponse:
    await auth_service.request_password_reset(request.email)
    return PasswordResetRequestResponse(detail="인증 코드가 이메일로 발송되었습니다.")


@auth_router.post(
    "/password-reset/confirm", response_model=PasswordResetConfirmResponse, status_code=status.HTTP_200_OK
)
async def confirm_password_reset(
    request: PasswordResetConfirmRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> PasswordResetConfirmResponse:
    await auth_service.confirm_password_reset(request.email, request.code, request.new_password)
    return PasswordResetConfirmResponse(detail="비밀번호가 변경되었습니다.")


@auth_router.post("/email-verify/send-code", response_model=EmailVerifySendResponse, status_code=status.HTTP_200_OK)
async def send_verification_code(
    request: EmailVerifySendRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> EmailVerifySendResponse:
    await auth_service.send_verification_code(str(request.email))
    return EmailVerifySendResponse(detail="인증 코드가 이메일로 발송되었습니다.")


@auth_router.post(
    "/email-verify/verify-code", response_model=EmailVerifyConfirmResponse, status_code=status.HTTP_200_OK
)
async def verify_email_code(
    request: EmailVerifyConfirmRequest,
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> EmailVerifyConfirmResponse:
    await auth_service.verify_email_code(str(request.email), request.code)
    return EmailVerifyConfirmResponse(detail="이메일 인증이 완료되었습니다.")
