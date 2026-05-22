from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.security import get_request_user
from app.dtos.chat import (
    ChatMessageResponse,
    ChatSessionResponse,
    CreateChatSessionRequest,
    SendChatMessageRequest,
)
from app.exceptions.common import NotFoundException
from app.models.users import User
from app.services.chat import ChatService

chat_router = APIRouter(prefix="/chat", tags=["Chat"])


@chat_router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=201,
)
async def create_chat_session(
    request: CreateChatSessionRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChatService, Depends(ChatService)],
) -> ChatSessionResponse:
    """
    챗봇 세션을 생성한다.

    - record_id: 대화 컨텍스트가 되는 medical_records PK (필수)
    - guide_id: 대화 컨텍스트가 되는 guides PK (선택)

    에러:
    - 401: 미인증
    - 404: record 없음 또는 다른 사용자 소유
    """
    session = await service.create_session(
        user=user,
        record_id=request.record_id,
        guide_id=request.guide_id,
    )
    if session is None:
        raise NotFoundException(detail="해당 record를 찾을 수 없습니다.")

    return ChatSessionResponse(
        session_id=session.id,
        record_id=session.record_id,
        guide_id=session.guide_id,
        status=session.status.value,
        created_at=session.created_at,
    )


@chat_router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
    status_code=200,
)
async def send_chat_message(
    session_id: int,
    request: SendChatMessageRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChatService, Depends(ChatService)],
) -> ChatMessageResponse:
    """
    챗봇 세션에 사용자 메시지를 보낸다.

    위험 질문이 감지되면 안전 안내문을 응답으로 반환하며,
    그 외에는 임시 응답을 반환한다 (LLM 연동 후 실제 답변으로 교체 예정).

    사용자 메시지와 챗봇 응답은 모두 DB에 저장된다.

    에러:
    - 401: 미인증
    - 404: 세션 없음 또는 다른 사용자 소유
    - 422: 메시지 길이 범위 벗어남 (1~2000자)
    """
    result = await service.send_message(
        user=user,
        session_id=session_id,
        message=request.message,
    )
    if result is None:
        raise NotFoundException(detail="해당 챗봇 세션을 찾을 수 없습니다.")
    return ChatMessageResponse(**result)
