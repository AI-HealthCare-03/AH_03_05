from tortoise.transactions import in_transaction

from app.models.chat_messages import ChatMessage, SenderType
from app.models.chat_sessions import ChatSession, ChatSessionStatus
from app.models.medical_records import MedicalRecord
from app.models.users import User
from app.services.safety import detect_risk_question

# 기본 안전 안내 문구
DEFAULT_SAFETY_NOTICE = "이 챗봇은 전문의의 진료를 대체할 수 없습니다."

# 위험 질문이 감지됐을 때의 안전 안내 응답
RISK_SAFETY_REPLY = (
    "이 질문은 의료 전문가의 진단·처방이 필요한 영역으로 보입니다. 정확한 판단은 의사·약사와 상담해 주세요."
)

# LLM 연동 전 임시 응답 (정훈님 LLM 가이드 PR 머지 후 실제 호출로 교체 예정)
MOCK_ASSISTANT_REPLY = (
    "복약 정보와 공식 가이드라인을 참고해 답변을 생성할 예정입니다. "
    "현재는 임시 응답이며, LLM 연동 후 실제 답변이 제공됩니다."
)


class ChatService:
    """챗봇 세션·메시지 서비스."""

    async def create_session(
        self,
        user: User,
        record_id: int,
        guide_id: int | None = None,
    ) -> ChatSession | None:
        """
        새 챗봇 세션을 생성한다.

        반환값:
            - ChatSession: 정상 생성된 세션
            - None: record_id가 존재하지 않거나 다른 사용자 소유 (404)
        """
        record = await MedicalRecord.get_or_none(id=record_id, user=user, deleted_at=None)
        if record is None:
            return None

        session = await ChatSession.create(
            user=user,
            record_id=record_id,
            guide_id=guide_id,
            status=ChatSessionStatus.ACTIVE,
        )
        return session

    async def send_message(
        self,
        user: User,
        session_id: int,
        message: str,
    ) -> dict | None:
        """
        세션에 사용자 메시지를 보내고, 안전 검사 후 챗봇 응답을 저장·반환한다.

        반환값:
            - dict: 응답 데이터
            - None: 세션이 존재하지 않거나 다른 사용자 소유 (404)
        """
        session = await ChatSession.get_or_none(id=session_id, user=user)
        if session is None:
            return None

        # 위험 질문 감지 (bool 반환)
        is_risky = detect_risk_question(message)

        # 위험 질문이면 안전 안내문을 응답으로, 그 외엔 임시 mock 응답
        if is_risky:
            assistant_text = RISK_SAFETY_REPLY
        else:
            assistant_text = MOCK_ASSISTANT_REPLY

        # user 메시지 + assistant 응답을 한 트랜잭션에 저장
        async with in_transaction():
            await ChatMessage.create(
                session=session,
                user=user,
                sender_type=SenderType.USER,
                content=message,
                safety_flag=is_risky,
                safety_notice=RISK_SAFETY_REPLY if is_risky else None,
            )
            await ChatMessage.create(
                session=session,
                user=user,
                sender_type=SenderType.ASSISTANT,
                content=assistant_text,
                safety_flag=False,
                safety_notice=None,
            )

        return {
            "session_id": session.id,
            "user_message": message,
            "assistant_message": assistant_text,
            "safety_flag": is_risky,
            "safety_notice": DEFAULT_SAFETY_NOTICE,
        }
