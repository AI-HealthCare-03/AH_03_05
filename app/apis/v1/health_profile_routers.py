from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.security import get_request_user
from app.dtos.health_profiles import HealthProfileResponse, HealthProfileUpdateRequest, HealthProfileUpdateResponse
from app.models.users import User
from app.services.health_profiles import HealthProfileService

health_profile_router = APIRouter(prefix="/health-profile", tags=["health-profile"])


@health_profile_router.get("", status_code=status.HTTP_200_OK)
async def get_health_profile(
    user: Annotated[User, Depends(get_request_user)],
    health_profile_service: Annotated[HealthProfileService, Depends(HealthProfileService)],
) -> dict:
    profile = await health_profile_service.get_health_profile(user)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="건강 프로필이 없습니다.")
    return HealthProfileResponse.model_validate(profile).model_dump(by_alias=True)


@health_profile_router.put("", status_code=status.HTTP_200_OK)
async def upsert_health_profile(
    request: HealthProfileUpdateRequest,
    user: Annotated[User, Depends(get_request_user)],
    health_profile_service: Annotated[HealthProfileService, Depends(HealthProfileService)],
) -> dict:
    profile = await health_profile_service.upsert_health_profile(user, request)
    return HealthProfileUpdateResponse.model_validate(profile).model_dump(by_alias=True)
