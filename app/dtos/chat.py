from datetime import datetime

from pydantic import BaseModel, Field

# --- 세션 생성 ---


class CreateChatSessionRequest(BaseModel):
    record_id: int = Field(description="대화 컨텍스트가 되는 medical_records PK")
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
