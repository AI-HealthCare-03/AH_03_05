from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.security import get_request_user
from app.dtos.chat import (
    ChatMessageListItem,
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatSessionListItem,
    ChatSessionListResponse,
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
    if session is None and request.record_id is not None:
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


@chat_router.get(
    "/sessions",
    response_model=ChatSessionListResponse,
    status_code=200,
)
async def list_chat_sessions(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChatService, Depends(ChatService)],
    limit: int = 20,
    offset: int = 0,
) -> ChatSessionListResponse:
    """
    사용자의 채팅 세션 목록을 조회한다 (updated_at 최신순).

    쿼리 파라미터:
    - limit: 조회 개수 (기본 20)
    - offset: 시작 위치 (기본 0)

    에러:
    - 401: 미인증
    """
    sessions, total = await service.list_sessions(user=user, limit=limit, offset=offset)
    return ChatSessionListResponse(
        items=[
            ChatSessionListItem(
                session_id=s.id,
                record_id=s.record_id,
                guide_id=s.guide_id,
                title=s.title,
                status=s.status.value,
                last_message_preview=s.last_message_preview,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in sessions
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@chat_router.get(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageListResponse,
    status_code=200,
)
async def list_chat_messages(
    session_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChatService, Depends(ChatService)],
    limit: int = 50,
    offset: int = 0,
) -> ChatMessageListResponse:
    """
    특정 세션의 메시지 목록을 조회한다 (created_at 오름차순).

    쿼리 파라미터:
    - limit: 조회 개수 (기본 50)
    - offset: 시작 위치 (기본 0)

    에러:
    - 401: 미인증
    - 404: 세션 없음 또는 다른 사용자 소유
    """
    result = await service.list_messages(user=user, session_id=session_id, limit=limit, offset=offset)
    if result is None:
        raise NotFoundException(detail="해당 챗봇 세션을 찾을 수 없습니다.")
    messages, total = result
    return ChatMessageListResponse(
        session_id=session_id,
        items=[
            ChatMessageListItem(
                message_id=m.id,
                sender_type=m.sender_type.value,
                content=m.content,
                safety_flag=m.safety_flag,
                safety_notice=m.safety_notice,
                created_at=m.created_at,
            )
            for m in messages
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@chat_router.delete("/sessions/{session_id}", status_code=204, summary="채팅 세션 소프트 딜리트")
async def delete_chat_session(
    session_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChatService, Depends(ChatService)],
):
    """
    사용자의 채팅 세션을 소프트 딜리트 처리합니다.
    - 본인 소유의 세션만 삭제 가능 (아닐 경우 404)
    - 성공 시 204 No Content 반환
    """
    await service.delete_session(user=user, session_id=session_id)
    return
