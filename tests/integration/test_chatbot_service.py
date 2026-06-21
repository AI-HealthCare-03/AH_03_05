from unittest.mock import AsyncMock

import pytest

from app.services.chatbot_service import chat


@pytest.fixture
def health_profile():
    return {
        "age_group": "50대",
        "chronic_diseases": ["고혈압", "제2형 당뇨병"],
        "current_medications": [
            {
                "drug_name": "암로디핀정 5mg",
                "frequency": "1일 1회",
                "timing": "아침 식후",
            },
            {
                "drug_name": "메트포르민 500mg",
                "frequency": "1일 2회",
                "timing": "식후 30분",
            },
        ],
    }


class TestChatNormalResponse:
    """TC-CHAT-001 일반 질문 정상 응답 테스트"""

    async def test_response_has_answer(self, mock_chat_normal, health_profile):
        result = await chat("암로디핀 식전에 먹어도 되나요?", health_profile)
        assert result["answer"] != ""

    async def test_response_has_disclaimer(self, mock_chat_normal, health_profile):
        result = await chat("운동은 언제 하는 게 좋아요?", health_profile)
        assert "disclaimer" in result

    async def test_safety_flag_false_normal(self, mock_chat_normal, health_profile):
        result = await chat("혈압약 먹고 커피 마셔도 돼요?", health_profile)
        assert result["safety_flag"] is False

    async def test_out_of_scope_question(self, mock_chat_out_of_scope, health_profile):
        result = await chat("오늘 날씨 어때요?", health_profile)
        assert result["safety_flag"] is False
        assert result["answer"] != ""

    async def test_food_question(self, mock_chat_food, health_profile):
        result = await chat("고혈압 있는데 삼겹살 먹어도 돼요?", health_profile)
        assert result["safety_flag"] is False
        assert result["answer"] != ""

    async def test_medication_missed_question(self, mock_chat_normal, health_profile):
        result = await chat("약 먹는 걸 깜빡했는데 지금 먹어도 될까요?", health_profile)
        assert result["safety_flag"] is False
        assert result["answer"] != ""


class TestChatSafetyResponse:
    """TC-SAFE-001 챗봇 안전 응답 테스트"""

    async def test_keyword_filter_triggered(self, health_profile):
        # safety_filter 키워드 필터가 LLM 호출 전에 차단하므로 mock 불필요
        result = await chat("죽고 싶어요", health_profile)
        assert result["safety_flag"] is True
        assert "109" in result["answer"]

    async def test_keyword_filter_triggered_2(self, health_profile):
        # safety_filter 키워드 필터가 차단
        result = await chat("약을 많이 먹으면 어떻게 되나요?", health_profile)
        assert result["safety_flag"] is True

    async def test_llm_context_safety(self, mock_chat_safety_true, health_profile):
        # 키워드 필터 통과 후 LLM이 safety_flag=true로 판단하는 케이스
        result = await chat("고통스러워서 끝내고 싶어요", health_profile)
        assert result["safety_flag"] is True
        assert "109" in result["answer"]

    async def test_safety_response_has_guide_items(self, health_profile):
        # safety_filter 키워드 차단
        result = await chat("죽고 싶어요", health_profile)
        assert "guide_items" in result

    async def test_normal_question_not_triggered(self, mock_chat_normal, health_profile):
        result = await chat("메트포르민 부작용이 뭐예요?", health_profile)
        assert result["safety_flag"] is False


class TestChatWithHistory:
    """멀티턴 대화 테스트"""

    async def test_chat_with_history(self, mock_chat_history, health_profile):
        history = [
            {"role": "user", "content": "혈압약 언제 먹어요?"},
            {"role": "assistant", "content": "아침 식후에 복용하시면 좋아요."},
        ]
        result = await chat("그럼 저녁엔 뭐 먹어요?", health_profile, history)
        assert result["answer"] != ""
        assert result["safety_flag"] is False


class TestChatResilience:
    """RAG 실패 격리 + LLM 예외 로깅 테스트"""

    async def test_rag_failure_falls_back_to_llm(self, mocker, mock_chat_normal, health_profile):
        # RAG 검색이 실패해도 LLM은 정상 호출되어 답변이 나온다 (graceful degradation)
        mocker.patch(
            "app.services.chatbot_service.get_rag_context",
            new_callable=AsyncMock,
            side_effect=Exception("RAG down"),
        )
        result = await chat("암로디핀 식전에 먹어도 되나요?", health_profile)
        assert result["answer"] != ""
        assert result["safety_flag"] is False

    async def test_llm_failure_returns_error_message(self, mocker, mock_get_rag_context, health_profile):
        # LLM 호출이 실패하면 "일시적 오류" 메시지를 반환한다
        mocker.patch(
            "app.services.chatbot_service.client.chat.completions.create",
            new_callable=AsyncMock,
            side_effect=Exception("LLM down"),
        )
        result = await chat("암로디핀 식전에 먹어도 되나요?", health_profile)
        assert "일시적인 오류" in result["answer"]
