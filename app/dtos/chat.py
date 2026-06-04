from datetime import datetime

from pydantic import BaseModel, Field

# --- 세션 생성 ---


class CreateChatSessionRequest(BaseModel):
    record_id: int | None = Field(default=None, description="대화 컨텍스트가 되는 medical_records PK (선택)")
    guide_id: int | None = Field(
        default=None,
        description="대화 컨텍스트가 되는 guides PK (선택)",
    )


class ChatSessionResponse(BaseModel):
    session_id: int
    record_id: int | None
    guide_id: int | None
    status: str
    created_at: datetime


# --- 메시지 전송 ---


class SendChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    session_id: int
    user_message: str
    assistant_message: str
    safety_flag: bool
    safety_notice: str | None
    category: str | None = None


# --- 세션 목록 조회 ---


class ChatSessionListItem(BaseModel):
    session_id: int
    record_id: int | None
    guide_id: int | None
    title: str | None
    status: str
    last_message_preview: str | None
    created_at: datetime
    updated_at: datetime


class ChatSessionListResponse(BaseModel):
    items: list[ChatSessionListItem]
    total: int
    limit: int
    offset: int


# --- 메시지 목록 조회 ---


class ChatMessageListItem(BaseModel):
    message_id: int
    sender_type: str
    content: str
    safety_flag: bool
    safety_notice: str | None
    category: str | None = None
    created_at: datetime


class ChatMessageListResponse(BaseModel):
    session_id: int
    items: list[ChatMessageListItem]
    total: int
    limit: int
    offset: int
