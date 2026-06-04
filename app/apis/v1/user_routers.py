from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies.security import get_request_user
from app.dtos.users import (
    PasswordChangeRequest,
    PasswordChangeResponse,
    UserInfoResponse,
    UserUpdateRequest,
    WithdrawRequest,
    WithdrawResponse,
)
from app.models.users import User
from app.services.auth import AuthService
from app.services.users import UserManageService

user_router = APIRouter(prefix="/users", tags=["users"])


@user_router.get("/me", response_model=UserInfoResponse, status_code=status.HTTP_200_OK)
async def user_me_info(
    user: Annotated[User, Depends(get_request_user)],
) -> UserInfoResponse:
    return UserInfoResponse.model_validate(user)


@user_router.patch("/me", response_model=UserInfoResponse, status_code=status.HTTP_200_OK)
async def update_user_me_info(
    update_data: UserUpdateRequest,
    user: Annotated[User, Depends(get_request_user)],
    user_manage_service: Annotated[UserManageService, Depends(UserManageService)],
) -> UserInfoResponse:
    updated_user = await user_manage_service.update_user(user=user, data=update_data)
    return UserInfoResponse.model_validate(updated_user)


@user_router.patch("/me/password", response_model=PasswordChangeResponse, status_code=status.HTTP_200_OK)
async def change_password(
    request: PasswordChangeRequest,
    user: Annotated[User, Depends(get_request_user)],
    user_manage_service: Annotated[UserManageService, Depends(UserManageService)],
) -> PasswordChangeResponse:
    await user_manage_service.change_password(user, request.current_password, request.new_password)
    return PasswordChangeResponse(detail="비밀번호가 변경되었습니다.")


@user_router.delete("/me", response_model=WithdrawResponse, status_code=status.HTTP_200_OK)
async def withdraw_user(
    request: WithdrawRequest,
    user: Annotated[User, Depends(get_request_user)],
    user_manage_service: Annotated[UserManageService, Depends(UserManageService)],
) -> WithdrawResponse:
    await user_manage_service.withdraw_user(user, request.password)
    return WithdrawResponse(detail="회원탈퇴가 완료되었습니다.")


@user_router.delete("/me/devices", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_all_devices(
    user: Annotated[User, Depends(get_request_user)],
    auth_service: Annotated[AuthService, Depends(AuthService)],
) -> None:
    """전체 기기 로그아웃. 해당 유저의 모든 refresh token을 revoke한다."""
    await auth_service.revoke_all_tokens(user)
