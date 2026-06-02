from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.security import get_request_user
from app.dtos.feedbacks import FeedbackCreateRequest, FeedbackResponse
from app.models.users import User
from app.services.feedbacks import FeedbackService

feedback_router = APIRouter(prefix="/feedbacks", tags=["Feedback"])


@feedback_router.post(
    "",
    response_model=FeedbackResponse,
    status_code=201,
)
async def create_feedback(
    request: FeedbackCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[FeedbackService, Depends(FeedbackService)],
) -> FeedbackResponse:
    """
    가이드 또는 챗봇 답변에 대한 피드백(별점/코멘트/신고)을 등록한다.
    - guide_id 또는 chat_message_id 중 하나 이상 필요
    에러:
    - 401: 미인증
    - 404: 연결한 guide/chat_message 없음 또는 다른 사용자 소유
    - 422: 타깃 누락 또는 rating 범위(1~5) 오류
    """
    feedback = await service.create_feedback(user=user, request=request)
    return FeedbackResponse.model_validate(feedback)
