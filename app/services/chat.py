from tortoise.transactions import in_transaction

from app.exceptions.common import NotFoundException
from app.models.chat_messages import ChatMessage, MessageCategory, SenderType
from app.models.chat_sessions import ChatSession, ChatSessionStatus
from app.models.guides import Guide, GuideItem, GuideItemType
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


def _classify_message(message: str) -> MessageCategory:
    """메시지 내용 키워드 기반 카테고리 분류."""

    msg = message.lower()
    if any(k in msg for k in ["부작용", "이상반응", "두통", "구역", "메스꺼움", "발진", "가려움", "어지럼"]):
        return MessageCategory.SIDE_EFFECT
    if any(k in msg for k in ["복용", "먹는 시간", "언제 먹", "식전", "식후", "공복", "용량", "몇 알", "몇mg"]):
        return MessageCategory.DOSAGE_TIMING
    if any(k in msg for k in ["운동", "식단", "음식", "술", "담배", "수면", "생활", "체중", "다이어트"]):
        return MessageCategory.LIFESTYLE
    return MessageCategory.GENERAL


async def _build_guide_context(session: ChatSession) -> str:
    """세션에 연결된 가이드를 LLM 프롬프트용 텍스트로 변환.

    가이드가 없거나(guide_id=None) 미완성이면 빈 문자열을 반환해
    기존 동작(가이드 없이 답변)과 동일하게 폴백한다.
    """
    guide_id = session.guide_id
    if guide_id is None:
        return ""

    guide = await Guide.get_or_none(id=guide_id)
    if guide is None:
        return ""

    parts: list[str] = []
    if guide.medication_guide:
        parts.append(f"[복약 안내]\n{guide.medication_guide}")
    if guide.lifestyle_guide:
        parts.append(f"[생활습관 안내]\n{guide.lifestyle_guide}")
    if guide.warning_message:
        parts.append(f"[주의사항]\n{guide.warning_message}")

    # 약품별/생활습관별 세부 항목 (있으면 함께 제공)
    items = await GuideItem.filter(guide_id=guide_id).order_by("item_type", "sort_order")
    item_lines: list[str] = []
    for item in items:
        label = {
            GuideItemType.MEDICATION: "복약",
            GuideItemType.LIFESTYLE: "생활습관",
            GuideItemType.WARNING: "주의",
        }.get(item.item_type, "항목")
        item_lines.append(f"- ({label}) {item.title}: {item.content}")
    if item_lines:
        parts.append("[세부 항목]\n" + "\n".join(item_lines))

    return "\n\n".join(parts)


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
        category = _classify_message(message)

        if is_risky:
            assistant_text = RISK_SAFETY_REPLY
            safety_flag = True
            disclaimer = DEFAULT_SAFETY_NOTICE
            category = MessageCategory.EMERGENCY
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

            # 세션에 연결된 가이드 컨텍스트 로드 (없으면 빈 문자열로 폴백)
            guide_context = await _build_guide_context(session)

            # LLM 호출
            result = await llm_chat(
                user_input=message,
                health_profile=health_profile,
                conversation_history=conversation_history,
                guide_context=guide_context,
            )

            if result.get("safety_flag"):
                assistant_text = RISK_SAFETY_REPLY
                safety_flag = True
                category = MessageCategory.EMERGENCY
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
                category=category,
            )
            assistant_msg = await ChatMessage.create(
                session=session,
                user=user,
                sender_type=SenderType.ASSISTANT,
                content=assistant_text,
                safety_flag=False,
                safety_notice=None,
                category=category,
            )
            session.last_message_at = assistant_msg.created_at
            session.last_message_preview = assistant_text[:100]
            # 첫 메시지면 user 질문 앞부분을 세션 제목으로 자동 설정
            if not session.title:
                session.title = message[:30]
            await session.save()

        return {
            "session_id": session.id,
            "user_message": message,
            "assistant_message": assistant_text,
            "safety_flag": safety_flag,
            "safety_notice": disclaimer,
            "category": str(category) if category else None,
        }

    async def list_sessions(
        self,
        user: User,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[ChatSession], int]:
        query = ChatSession.filter(user=user).exclude(status=ChatSessionStatus.DELETED)
        total = await query.count()
        sessions = await query.order_by("-updated_at").offset(offset).limit(limit)
        return sessions, total

    async def delete_session(self, user: User, session_id: int) -> None:
        session = await ChatSession.get_or_none(id=session_id, user=user)
        if session is None:
            raise NotFoundException("채팅 세션을 찾을 수 없습니다.")
        session.status = ChatSessionStatus.DELETED
        await session.save(update_fields=["status", "updated_at"])

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
