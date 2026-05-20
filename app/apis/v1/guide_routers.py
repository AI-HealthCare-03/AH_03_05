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
