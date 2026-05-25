"""
LLM 응답 mock fixtures.

실제 OpenAI API 응답을 흉내낸 샘플 dict들.
각 시나리오는 통합 테스트(test_llm_service, test_chatbot_service)에서
client.chat.completions.create() 호출의 반환값으로 사용된다.
"""

import json
from unittest.mock import MagicMock


def make_openai_response(content_dict: dict) -> MagicMock:
    """OpenAI client.chat.completions.create() 반환값을 흉내낸다."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message = MagicMock()
    mock_response.choices[0].message.content = json.dumps(content_dict, ensure_ascii=False)
    return mock_response


# generate_guide() 1호출: 복약 가이드 응답

MED_HYPERTENSION = {
    "medication_guide": "처방받으신 암로디핀정은 혈압을 낮추는 약이에요. 매일 아침 식후에 1정 복용하시면 좋아요.",
    "warning_message": None,
    "guide_items": [
        {
            "item_type": "MEDICATION",
            "title": "암로디핀정 5mg",
            "content": "혈압을 낮추는 칼슘채널차단제예요. 아침 식후 1정 복용하세요.",
            "sort_order": 1,
            "guideline_source_id": None,
        },
    ],
}

MED_DIABETES = {
    "medication_guide": "메트포르민은 혈당을 낮추는 약이에요. 식후 30분에 하루 2회 복용해주세요.",
    "warning_message": "신기능 장애가 있거나 조영제 검사 예정이라면 복용을 중단하고 의사와 상담해주세요.",
    "guide_items": [
        {
            "item_type": "MEDICATION",
            "title": "메트포르민 500mg",
            "content": "간에서 포도당 생성을 억제하는 혈당강하제예요. 식후 30분에 복용하세요.",
            "sort_order": 1,
            "guideline_source_id": None,
        },
        {
            "item_type": "WARNING",
            "title": "신기능 주의",
            "content": "신기능 장애 환자는 주의가 필요하고, 조영제 검사 전 복용 중단이 필요해요.",
            "sort_order": 2,
            "guideline_source_id": None,
        },
    ],
}

MED_PREGNANCY = {
    "medication_guide": "암로디핀정은 혈압을 낮추는 약이에요. 처방대로 복용해주세요.",
    "warning_message": "임신 가능성이 있다면 반드시 의사와 상담해주세요.",
    "guide_items": [
        {
            "item_type": "MEDICATION",
            "title": "암로디핀정 5mg",
            "content": "혈압을 낮추는 약이에요. 아침 식후 복용하세요.",
            "sort_order": 1,
            "guideline_source_id": None,
        },
        {
            "item_type": "WARNING",
            "title": "임신 관련 주의",
            "content": "임부 또는 임신 가능성이 있는 여성에게 투여하지 않는 것이 바람직해요.",
            "sort_order": 2,
            "guideline_source_id": None,
        },
    ],
}

MED_OVER65 = {
    "medication_guide": "고령 환자분을 위한 복약 안내예요. 처방된 시간에 정확히 복용해주세요.",
    "warning_message": None,
    "guide_items": [
        {
            "item_type": "MEDICATION",
            "title": "처방 약물",
            "content": "고령 환자는 부작용에 더 민감할 수 있으니 변화가 있으면 알려주세요.",
            "sort_order": 1,
            "guideline_source_id": None,
        },
    ],
}


# generate_guide() 2호출: 생활습관 가이드 응답

LIFESTYLE_HYPERTENSION = {
    "lifestyle_guide": "저염식과 규칙적인 유산소 운동이 혈압 관리에 도움이 돼요. 매일 혈압을 측정하고 기록해보세요.",
    "guide_items": [
        {
            "item_type": "LIFESTYLE",
            "title": "저염식 실천",
            "content": "하루 나트륨 섭취를 2000mg 이하로 줄여보세요. 국물은 적게 드시는 것이 좋아요.",
            "sort_order": 1,
            "guideline_source_id": None,
        },
        {
            "item_type": "LIFESTYLE",
            "title": "규칙적인 운동",
            "content": "주 5회 30분 이상 유산소 운동을 해보세요. 빠르게 걷기도 좋아요.",
            "sort_order": 2,
            "guideline_source_id": None,
        },
        {
            "item_type": "LIFESTYLE",
            "title": "절주",
            "content": "남성 하루 2잔, 여성 1잔 이내로 음주를 제한하시면 좋아요.",
            "sort_order": 3,
            "guideline_source_id": None,
        },
    ],
}

LIFESTYLE_DIABETES = {
    "lifestyle_guide": "혈당 관리를 위해 규칙적인 식사와 운동이 중요해요. 매일 혈당을 측정해주세요.",
    "guide_items": [
        {
            "item_type": "LIFESTYLE",
            "title": "혈당 자가 모니터링",
            "content": "식전 식후 혈당을 측정하고 기록해보세요. 패턴 파악에 도움이 돼요.",
            "sort_order": 1,
            "guideline_source_id": None,
        },
        {
            "item_type": "LIFESTYLE",
            "title": "규칙적인 운동",
            "content": "주 5회 30분 이상 유산소 운동을 권장해요.",
            "sort_order": 2,
            "guideline_source_id": None,
        },
        {
            "item_type": "LIFESTYLE",
            "title": "금연",
            "content": "흡연은 혈관 합병증 위험을 높이니 금연을 권장드려요.",
            "sort_order": 3,
            "guideline_source_id": None,
        },
    ],
}


# chat() 응답: 챗봇 시나리오별

CHAT_NORMAL = {
    "answer": "암로디핀은 식사와 관계없이 복용 가능해요. 다만 일정한 시간에 드시는 것이 좋아요. 변경이 필요하면 담당 의사와 상담해 주세요.",
    "safety_flag": False,
    "disclaimer": "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요. 개인 상태에 따라 다를 수 있으니 담당 의사와 상담해 주세요.",
    "related_items": [],
}

CHAT_FOOD = {
    "answer": "고혈압이 있으시면 삼겹살처럼 포화지방이 많은 음식은 가끔 즐기는 정도로 드시는 게 좋아요. 쌈채소와 함께 드시고 국물은 줄여보세요. 자세한 식단은 담당 의사와 상담해 주세요.",
    "safety_flag": False,
    "disclaimer": "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요. 개인 상태에 따라 다를 수 있으니 담당 의사와 상담해 주세요.",
    "related_items": [],
}

CHAT_OUT_OF_SCOPE = {
    "answer": "날씨처럼 의료와 관련 없는 주제는 답변드리기 어려워요. 복약이나 생활습관 관련 질문 있으시면 도와드릴게요.",
    "safety_flag": False,
    "disclaimer": "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요.",
    "related_items": [],
}

CHAT_SAFETY_TRUE = {
    "answer": "전문가의 도움이 필요한 상황으로 보여요.",
    "safety_flag": True,
    "disclaimer": "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요.",
    "related_items": [],
}

CHAT_HISTORY = {
    "answer": "혈압약 복용 후에는 평소대로 식사하시면 돼요. 저녁에는 저염식 위주로 드시는 게 좋아요.",
    "safety_flag": False,
    "disclaimer": "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요. 개인 상태에 따라 다를 수 있으니 담당 의사와 상담해 주세요.",
    "related_items": [],
}
