from fastapi import APIRouter
from pydantic import BaseModel

from app.services.safety import detect_risk_question

chat_router = APIRouter(prefix="/chat", tags=["Chat"])


class CreateChatSessionRequest(BaseModel):
    record_id: int
    guide_id: int | None = None


class SendChatMessageRequest(BaseModel):
    message: str


@chat_router.post("/sessions")
async def create_chat_session(request: CreateChatSessionRequest):
    return {
        "session_id": 1,
        "record_id": request.record_id,
        "guide_id": request.guide_id,
        "status": "active",
    }


@chat_router.post("/sessions/{session_id}/messages")
async def send_chat_message(session_id: int, request: SendChatMessageRequest):
    safety_result = detect_risk_question(request.message)

    if safety_result["safety_flag"]:
        return {
            "session_id": session_id,
            "user_message": request.message,
            "assistant_message": safety_result["safety_notice"],
            "safety_flag": True,
            "safety_notice": safety_result["safety_notice"],
        }

    return {
        "session_id": session_id,
        "user_message": request.message,
        "assistant_message": "복약 정보와 공식 가이드라인을 참고해 답변을 생성할 예정입니다.",
        "safety_flag": False,
        "safety_notice": "이 챗봇은 전문의의 진료를 대체할 수 없습니다.",
    }
