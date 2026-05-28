from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dtos.auth import (
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    LogoutResponse,
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
