from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies.security import get_request_user
from app.dtos.consents import (
    ConsentItemResponse,
    ConsentListResponse,
    ConsentToggleRequest,
    ConsentToggleResponse,
)
from app.exceptions.common import NotFoundException
from app.models.users import User
from app.services.consents import ConsentService

consents_router = APIRouter(prefix="/users/me/consents", tags=["consents"])


@consents_router.get("", response_model=ConsentListResponse, status_code=status.HTTP_200_OK)
async def get_consents(
    user: Annotated[User, Depends(get_request_user)],
    consent_service: Annotated[ConsentService, Depends(ConsentService)],
) -> ConsentListResponse:
    consents = await consent_service.get_consents(user)
    return ConsentListResponse(
        consents=[ConsentItemResponse(
            consent_type=c.consent_type,
            required_type=c.required_type,
            is_agreed=c.is_agreed,
            agreed_at=c.agreed_at,
            revoked_at=c.revoked_at,
        ) for c in consents]
    )


@consents_router.patch(
    "/{consent_type}",
    response_model=ConsentToggleResponse,
    status_code=status.HTTP_200_OK,
)
async def toggle_consent(
    consent_type: str,
    request: ConsentToggleRequest,
    user: Annotated[User, Depends(get_request_user)],
    consent_service: Annotated[ConsentService, Depends(ConsentService)],
) -> ConsentToggleResponse:
    consent = await consent_service.toggle_consent(user, consent_type, request.is_agreed)
    if consent is None:
        raise NotFoundException(detail="약관을 찾을 수 없습니다.")
    return ConsentToggleResponse(
        consent_type=consent.consent_type,
        is_agreed=consent.is_agreed,
        agreed_at=consent.agreed_at,
        revoked_at=consent.revoked_at,
    )
