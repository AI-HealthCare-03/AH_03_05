from tortoise.transactions import in_transaction

from app.models.chat_messages import ChatMessage, SenderType
from app.models.chat_sessions import ChatSession, ChatSessionStatus
from app.models.medical_records import MedicalRecord
from app.models.user_health_profiles import UserHealthProfile
from app.models.users import User
from app.services.chatbot_service import chat as llm_chat
from app.services.safety import detect_risk_question

# 기본 안전 안내 문구
DEFAULT_SAFETY_NOTICE = "이 챗봇은 전문의의 진료를 대체할 수 없습니다."

# 위험 질문이 감지됐을 때의 안전 안내 응답
RISK_SAFETY_REPLY = (
    "이 질문은 의료 전문가의 진단·처방이 필요한 영역으로 보입니다. 정확한 판단은 의사·약사와 상담해 주세요."
)


class ChatService:
    """챗봇 세션·메시지 서비스."""

    async def create_session(
        self,
        user: User,
        record_id: int | None = None,
        guide_id: int | None = None,
    ) -> ChatSession | None:
        if record_id is not None:
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
        session = await ChatSession.get_or_none(id=session_id, user=user)
        if session is None:
            return None

        # 위험 질문 1차 감지
        is_risky = detect_risk_question(message)

        if is_risky:
            assistant_text = RISK_SAFETY_REPLY
            safety_flag = True
            disclaimer = DEFAULT_SAFETY_NOTICE
        else:
            # health_profile 구성
            health_profile_obj = await UserHealthProfile.get_or_none(user=user)
            health_profile = {}
            if health_profile_obj:
                health_profile = {
                    "age_group": health_profile_obj.age_group,
                    "chronic_diseases": health_profile_obj.chronic_diseases or [],
                    "current_medications": health_profile_obj.current_medications or [],
                    "doctor_opinion": health_profile_obj.doctor_opinion or "",
                }

            # 이전 대화 히스토리 (최근 10개)
            prev_messages = await ChatMessage.filter(session=session).order_by("-created_at").limit(10)
            conversation_history = [
                {"role": "user" if m.sender_type == SenderType.USER else "assistant", "content": m.content}
                for m in reversed(prev_messages)
            ]

            # LLM 호출
            result = llm_chat(
                user_input=message,
                health_profile=health_profile,
                conversation_history=conversation_history,
            )

            if result.get("safety_flag"):
                assistant_text = RISK_SAFETY_REPLY
                safety_flag = True
            else:
                assistant_text = result.get("answer", "")
                safety_flag = False

            disclaimer = result.get("disclaimer", DEFAULT_SAFETY_NOTICE)

        async with in_transaction():
            await ChatMessage.create(
                session=session,
                user=user,
                sender_type=SenderType.USER,
                content=message,
                safety_flag=safety_flag,
                safety_notice=RISK_SAFETY_REPLY if safety_flag else None,
            )
            assistant_msg = await ChatMessage.create(
                session=session,
                user=user,
                sender_type=SenderType.ASSISTANT,
                content=assistant_text,
                safety_flag=False,
                safety_notice=None,
            )
            session.last_message_at = assistant_msg.created_at
            session.last_message_preview = assistant_text[:100]
            await session.save()

        return {
            "session_id": session.id,
            "user_message": message,
            "assistant_message": assistant_text,
            "safety_flag": safety_flag,
            "safety_notice": disclaimer,
        }

    async def list_sessions(
        self,
        user: User,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[ChatSession], int]:
        query = ChatSession.filter(user=user)
        total = await query.count()
        sessions = await query.order_by("-updated_at").offset(offset).limit(limit)
        return sessions, total

    async def list_messages(
        self,
        user: User,
        session_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ChatMessage], int] | None:
        session = await ChatSession.get_or_none(id=session_id, user=user)
        if session is None:
            return None
        query = ChatMessage.filter(session=session)
        total = await query.count()
        messages = await query.order_by("created_at").offset(offset).limit(limit)
        return messages, total

    async def delete_session(self, user: User, session_id: int) -> None:
        """채팅 세션을 소프트 딜리트(status=DELETED) 처리합니다."""
        from app.exceptions.common import NotFoundException

        # 본인 소유의 세션인지 검증 (없으면 404)
        session = await ChatSession.get_or_none(id=session_id, user=user)
        if session is None:
            raise NotFoundException("채팅 세션을 찾을 수 없습니다.")

        # 소프트 딜리트 필드 업데이트 후 저장
        session.status = ChatSessionStatus.DELETED
        await session.save()
