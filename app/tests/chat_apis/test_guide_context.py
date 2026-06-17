from tortoise.contrib.test import TestCase

from app.models.chat_sessions import ChatSession, ChatSessionStatus
from app.models.guides import Guide, GuideItem, GuideItemType, GuideStatus
from app.models.users import User
from app.services.chat import _build_guide_context
from app.services.chatbot_service import build_chatbot_system_prompt


async def _create_user(email: str) -> User:
    """테스트용 user 직접 생성."""
    return await User.create(
        email=email,
        password_hash="hashed-not-used-here",
        name="가이드테스터",
    )


class TestBuildGuideContext(TestCase):
    """_build_guide_context: 세션에 연결된 가이드를 LLM 프롬프트용 텍스트로 변환."""

    async def test_returns_empty_when_no_guide(self):
        # guide_id가 없는 세션이면 빈 문자열로 폴백 (기존 동작 유지)
        user = await _create_user("ctx_noguide@example.com")
        session = await ChatSession.create(
            user=user,
            status=ChatSessionStatus.ACTIVE,
        )

        result = await _build_guide_context(session)

        assert result == ""

    async def test_formats_guide_body(self):
        # medication/lifestyle/warning 본문이 라벨과 함께 포맷됨
        user = await _create_user("ctx_body@example.com")
        guide = await Guide.create(
            user=user,
            status=GuideStatus.COMPLETED,
            medication_guide="아침 식후 30분에 복용하세요.",
            lifestyle_guide="저염식을 권장해요.",
            warning_message="어지럼증이 있으면 의사와 상담하세요.",
        )
        session = await ChatSession.create(
            user=user,
            guide=guide,
            status=ChatSessionStatus.ACTIVE,
        )

        result = await _build_guide_context(session)

        assert "[복약 안내]" in result
        assert "아침 식후 30분에 복용하세요." in result
        assert "[생활습관 안내]" in result
        assert "저염식을 권장해요." in result
        assert "[주의사항]" in result
        assert "어지럼증이 있으면 의사와 상담하세요." in result

    async def test_includes_guide_items(self):
        # GuideItem 세부 항목이 라벨과 함께 포함됨
        user = await _create_user("ctx_items@example.com")
        guide = await Guide.create(
            user=user,
            status=GuideStatus.COMPLETED,
            medication_guide="복약 안내 본문",
        )
        await GuideItem.create(
            guide=guide,
            item_type=GuideItemType.MEDICATION,
            title="아모디핀",
            content="혈압약, 하루 1회",
            sort_order=0,
        )
        await GuideItem.create(
            guide=guide,
            item_type=GuideItemType.LIFESTYLE,
            title="운동",
            content="가벼운 걷기 30분",
            sort_order=1,
        )
        session = await ChatSession.create(
            user=user,
            guide=guide,
            status=ChatSessionStatus.ACTIVE,
        )

        result = await _build_guide_context(session)

        assert "[세부 항목]" in result
        assert "(복약) 아모디핀: 혈압약, 하루 1회" in result
        assert "(생활습관) 운동: 가벼운 걷기 30분" in result


class TestSystemPromptGuideInjection(TestCase):
    """build_chatbot_system_prompt: guide_context를 시스템 프롬프트에 주입."""

    async def test_guide_context_injected_into_prompt(self):
        guide_context = "[복약 안내]\n아침 식후 30분에 복용하세요."

        prompt = build_chatbot_system_prompt("", guide_context)

        assert "[현재 상담 중인 가이드]" in prompt
        assert "아침 식후 30분에 복용하세요." in prompt

    async def test_no_guide_section_when_empty(self):
        # guide_context가 없으면 가이드 섹션이 들어가지 않음 (하위호환)
        prompt = build_chatbot_system_prompt("", "")

        assert "[현재 상담 중인 가이드]" not in prompt
