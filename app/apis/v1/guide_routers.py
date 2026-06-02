from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.security import get_request_user
from app.dtos.guides import (
    GenerateGuideRequest,
    GenerateGuideResponse,
)
from app.exceptions.common import NotFoundException
from app.models.users import User
from app.services.guides import GuideService

guide_router = APIRouter(prefix="/guides", tags=["Guides"])


@guide_router.post(
    "/generate",
    response_model=GenerateGuideResponse,
    status_code=200,
)
async def generate_guide_for_record(
    request: GenerateGuideRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[GuideService, Depends(GuideService)],
) -> GenerateGuideResponse:
    """
    지정한 medical_record를 기반으로 LLM 복약·생활습관 가이드를 생성한다.

    내부적으로 다음 정보를 LLM에 전달:
    - 사용자 건강 프로필 (나이대, 만성질환, 의사 소견)
    - record에 연결된 medication 목록

    LLM 호출 성공 시 Guide / GuideItem 테이블에 저장하고,
    명세서(docs/spec/llm_output_format.md)대로 응답한다.

    에러:
    - 401: 미인증
    - 404: record 없음 또는 다른 사용자 소유
    """
    result = await service.generate_for_record(user=user, record_id=request.record_id)
    if result is None:
        raise NotFoundException(detail="해당 record를 찾을 수 없습니다.")
    return GenerateGuideResponse(**result)


@guide_router.get(
    "/{guide_id}",
    response_model=GenerateGuideResponse,
    status_code=200,
)
async def get_guide(
    guide_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[GuideService, Depends(GuideService)],
) -> GenerateGuideResponse:
    """
    저장된 가이드를 단건 조회한다.

    본인이 생성한 가이드만 조회 가능하다.
    응답 형식은 POST /generate와 동일하다.

    에러:
    - 401: 미인증
    - 404: 가이드 없음 또는 다른 사용자 소유
    """
    result = await service.get_guide_by_id(user=user, guide_id=guide_id)
    if result is None:
        raise NotFoundException(detail="해당 가이드를 찾을 수 없습니다.")
    return GenerateGuideResponse(**result)


records_guide_router = APIRouter(prefix="/records", tags=["Guides"])


@records_guide_router.get(
    "/{record_id}/guide",
    response_model=GenerateGuideResponse,
    status_code=200,
)
async def get_record_guide(
    record_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[GuideService, Depends(GuideService)],
) -> GenerateGuideResponse:
    """지정한 medical_record의 최신 가이드를 조회한다. 본인 소유만."""
    result = await service.get_latest_guide_by_record(user=user, record_id=record_id)
    if result is None:
        raise NotFoundException(detail="해당 기록의 가이드를 찾을 수 없습니다.")
    return GenerateGuideResponse(**result)
