"""
통합 테스트용 fixture.

OpenAI client를 mock으로 대체하여 실제 API 호출 없이 테스트를 실행한다.

핵심 전략:
    - app.services.chatbot_service.client.chat.completions.create
    - app.services.llm_service.client.chat.completions.create
    위 두 메서드를 mocker.patch로 대체한다.

    실제 호출이 발생하지 않으므로 OPENAI_API_KEY 없이도 테스트 통과 가능.
"""

import pytest

from tests.integration.fixtures.llm_responses import (
    CHAT_FOOD,
    CHAT_HISTORY,
    CHAT_NORMAL,
    CHAT_OUT_OF_SCOPE,
    CHAT_SAFETY_TRUE,
    LIFESTYLE_DIABETES,
    LIFESTYLE_HYPERTENSION,
    MED_DIABETES,
    MED_HYPERTENSION,
    MED_OVER65,
    MED_PREGNANCY,
    make_openai_response,
)

# llm_service.generate_guide() 용
# generate_guide는 OpenAI를 2번 호출 (복약 -> 생활습관)
# side_effect=[med_response, lifestyle_response] 로 순차 반환


@pytest.fixture
def mock_generate_guide_hypertension(mocker):
    """고혈압 환자용: medication + lifestyle 응답 한 쌍"""
    return mocker.patch(
        "app.services.llm_service.client.chat.completions.create",
        side_effect=[
            make_openai_response(MED_HYPERTENSION),
            make_openai_response(LIFESTYLE_HYPERTENSION),
        ],
    )


@pytest.fixture
def mock_generate_guide_diabetes(mocker):
    """당뇨 환자용: medication + lifestyle 응답 한 쌍"""
    return mocker.patch(
        "app.services.llm_service.client.chat.completions.create",
        side_effect=[
            make_openai_response(MED_DIABETES),
            make_openai_response(LIFESTYLE_DIABETES),
        ],
    )


@pytest.fixture
def mock_generate_guide_pregnancy(mocker):
    """임신 가능 여성용: WARNING 포함된 medication + 일반 lifestyle"""
    return mocker.patch(
        "app.services.llm_service.client.chat.completions.create",
        side_effect=[
            make_openai_response(MED_PREGNANCY),
            make_openai_response(LIFESTYLE_HYPERTENSION),
        ],
    )


@pytest.fixture
def mock_generate_guide_over65(mocker):
    """65세 이상 고령자용: 고령자 medication + 일반 lifestyle"""
    return mocker.patch(
        "app.services.llm_service.client.chat.completions.create",
        side_effect=[
            make_openai_response(MED_OVER65),
            make_openai_response(LIFESTYLE_HYPERTENSION),
        ],
    )


# chatbot_service.chat() 용
# chat은 OpenAI를 1번 호출


@pytest.fixture
def mock_chat_normal(mocker):
    """일반 복약 질문 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        return_value=make_openai_response(CHAT_NORMAL),
    )


@pytest.fixture
def mock_chat_food(mocker):
    """음식 관련 질문 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        return_value=make_openai_response(CHAT_FOOD),
    )


@pytest.fixture
def mock_chat_out_of_scope(mocker):
    """범위 외 질문 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        return_value=make_openai_response(CHAT_OUT_OF_SCOPE),
    )


@pytest.fixture
def mock_chat_safety_true(mocker):
    """LLM이 safety_flag=true로 판단한 응답 (2차 필터)"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        return_value=make_openai_response(CHAT_SAFETY_TRUE),
    )


@pytest.fixture
def mock_chat_history(mocker):
    """멀티턴 대화 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        return_value=make_openai_response(CHAT_HISTORY),
    )
