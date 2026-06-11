"""
통합 테스트용 fixture.

OpenAI client / 식약처 MFDS client를 mock으로 대체하여
실제 외부 API 호출 없이 테스트를 실행한다.

핵심 전략:
    - app.services.chatbot_service.client.chat.completions.create
    - app.services.llm_service.client.chat.completions.create
    - app.services.mfds_client.MFDSClient.search_drug / get_drug_detail
    위 메서드들을 mocker.patch로 대체한다.

    실제 호출이 발생하지 않으므로 OPENAI_API_KEY, MFDS_API_KEY 없이도 통과 가능.
"""

from unittest.mock import AsyncMock

import httpx
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
from tests.integration.fixtures.mfds_responses import (
    DETAIL_NONE,
    DETAIL_TYLENOL,
    SEARCH_EMPTY,
    SEARCH_TYLENOL,
)


@pytest.fixture
def mock_get_rag_context(mocker):
    """RAG 벡터 검색 mock"""
    return mocker.patch(
        "app.services.chatbot_service.get_rag_context",
        new_callable=AsyncMock,
        return_value="",
    )


# llm_service.generate_guide() 용
# generate_guide는 OpenAI를 2번 호출 (복약 -> 생활습관)


@pytest.fixture
def mock_generate_guide_hypertension(mocker):
    """고혈압 환자용: medication + lifestyle 응답 한 쌍"""
    return mocker.patch(
        "app.services.llm_service.client.chat.completions.create",
        new_callable=AsyncMock,
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
        new_callable=AsyncMock,
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
        new_callable=AsyncMock,
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
        new_callable=AsyncMock,
        side_effect=[
            make_openai_response(MED_OVER65),
            make_openai_response(LIFESTYLE_HYPERTENSION),
        ],
    )


# chatbot_service.chat() 용


@pytest.fixture
def mock_chat_normal(mocker, mock_get_rag_context):
    """일반 복약 질문 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        new_callable=AsyncMock,
        return_value=make_openai_response(CHAT_NORMAL),
    )


@pytest.fixture
def mock_chat_food(mocker, mock_get_rag_context):
    """음식 관련 질문 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        new_callable=AsyncMock,
        return_value=make_openai_response(CHAT_FOOD),
    )


@pytest.fixture
def mock_chat_out_of_scope(mocker, mock_get_rag_context):
    """범위 외 질문 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        new_callable=AsyncMock,
        return_value=make_openai_response(CHAT_OUT_OF_SCOPE),
    )


@pytest.fixture
def mock_chat_safety_true(mocker, mock_get_rag_context):
    """LLM이 safety_flag=true로 판단한 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        new_callable=AsyncMock,
        return_value=make_openai_response(CHAT_SAFETY_TRUE),
    )


@pytest.fixture
def mock_chat_history(mocker, mock_get_rag_context):
    """멀티턴 대화 응답"""
    return mocker.patch(
        "app.services.chatbot_service.client.chat.completions.create",
        new_callable=AsyncMock,
        return_value=make_openai_response(CHAT_HISTORY),
    )


# 식약처(MFDS) API용
# MFDSClient의 메서드 자체를 patch하여 httpx 호출 자체를 우회


@pytest.fixture
def mock_mfds_search_success(mocker):
    """정상 검색: 약품 2건 반환"""
    return mocker.patch(
        "app.services.mfds_client.MFDSClient.search_drug",
        return_value=SEARCH_TYLENOL,
    )


@pytest.fixture
def mock_mfds_search_empty(mocker):
    """검색 결과 0건"""
    return mocker.patch(
        "app.services.mfds_client.MFDSClient.search_drug",
        return_value=SEARCH_EMPTY,
    )


@pytest.fixture
def mock_mfds_search_timeout(mocker):
    """검색 중 timeout"""
    return mocker.patch(
        "app.services.mfds_client.MFDSClient.search_drug",
        side_effect=httpx.TimeoutException("timed out"),
    )


@pytest.fixture
def mock_mfds_detail_success(mocker):
    """정상 상세 조회: 약품 1건 반환"""
    return mocker.patch(
        "app.services.mfds_client.MFDSClient.get_drug_detail",
        return_value=DETAIL_TYLENOL,
    )


@pytest.fixture
def mock_mfds_detail_not_found(mocker):
    """상세 조회 결과 없음 (None 반환)"""
    return mocker.patch(
        "app.services.mfds_client.MFDSClient.get_drug_detail",
        return_value=DETAIL_NONE,
    )


@pytest.fixture
def mock_mfds_detail_rate_limit(mocker):
    """429 rate limit"""
    mock_response = httpx.Response(
        status_code=429,
        request=httpx.Request("GET", "http://test"),
    )
    return mocker.patch(
        "app.services.mfds_client.MFDSClient.get_drug_detail",
        side_effect=httpx.HTTPStatusError(
            "Rate limit exceeded",
            request=mock_response.request,
            response=mock_response,
        ),
    )
