"""LLM 재현성(reproducibility) 검증 테스트.

동일 입력에서 결과 편차를 최소화하기 위해 모든 OpenAI 호출에
고정 seed(LLM_SEED)를 전달하는지 검증한다.
실제 OpenAI 호출 없이 mock의 호출 인자를 확인하는 방식.
"""

import pytest

from app.services.chatbot_service import LLM_SEED as CHATBOT_SEED
from app.services.chatbot_service import chat
from app.services.llm_service import LLM_SEED as GUIDE_SEED
from app.services.llm_service import generate_guide


@pytest.fixture
def health_profile():
    return {
        "age_group": "50대",
        "chronic_diseases": ["고혈압"],
        "current_medications": [
            {"drug_name": "암로디핀정 5mg", "frequency": "1일 1회", "timing": "아침 식후"},
        ],
    }


class TestLLMReproducibility:
    """동일 입력 결과 편차 최소화: 고정 seed 전달 검증."""

    def test_chatbot_seed_is_fixed(self):
        # seed 상수가 두 서비스에서 동일하게 정의돼 있어야 한다
        assert CHATBOT_SEED == GUIDE_SEED
        assert isinstance(CHATBOT_SEED, int)

    def test_chatbot_call_passes_seed(self, mock_chat_normal, health_profile):
        chat("암로디핀 식전에 먹어도 되나요?", health_profile)
        # OpenAI create()가 seed=LLM_SEED로 호출됐는지 검증
        assert mock_chat_normal.called
        kwargs = mock_chat_normal.call_args.kwargs
        assert kwargs["seed"] == CHATBOT_SEED

    def test_chatbot_temperature_unchanged(self, mock_chat_normal, health_profile):
        # seed 추가가 기존 temperature 설정을 건드리지 않았는지 확인
        chat("운동 언제 하면 좋아요?", health_profile)
        kwargs = mock_chat_normal.call_args.kwargs
        assert kwargs["temperature"] == 0.5

    def test_guide_calls_pass_seed(self, mock_generate_guide_hypertension, health_profile):
        generate_guide(health_profile)
        # generate_guide는 OpenAI를 2번 호출(복약->생활습관), 둘 다 seed 전달돼야 함
        assert mock_generate_guide_hypertension.call_count == 2
        for call in mock_generate_guide_hypertension.call_args_list:
            assert call.kwargs["seed"] == GUIDE_SEED

    def test_guide_temperature_unchanged(self, mock_generate_guide_hypertension, health_profile):
        generate_guide(health_profile)
        for call in mock_generate_guide_hypertension.call_args_list:
            assert call.kwargs["temperature"] == 0.3
