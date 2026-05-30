# ── 위험 키워드 목록 v1 ──

# 명시적 자살/자해 (맥락 무관 DANGER)
EXPLICIT_DANGER_KEYWORDS = [
    "자살",
    "자해",
    "죽고 싶",
    "죽고싶",
    "살기 싫",
    "살기싫",
    "사라지고 싶",
    "사라지고싶",
    "없어지고 싶",
    "없어지고싶",
    "스스로 목숨",
    "목숨을 끊",
    "극단적 선택",
    "칼로 긋",
    "손목 긋",
    "혈관 끊",
    "죽어버릴까",
    "죽어버릴래",
    "죽어버리고 싶",
    "죽어버리고싶",
    "뛰어내리",
    "목을 매",
    "목매달",
]

# 의료 맥락 + 위험 표현
MEDICAL_DANGER_KEYWORDS = [
    "약을 많이 먹으면",
    "약 많이 먹으면",
    "약을 한꺼번에",
    "약을 많이 먹고",
    "약 왕창",
    "약 다 먹으면",
    "약 전부 먹으면",
    "약이 너무 많은데 다 먹어도",
    "약 다 먹어버리고 싶",
    "약 다 먹어버리",
    "과량 복용",
    "과량복용",
    "약으로 죽",
    "약 먹고 죽",
    "약 다 털어넣",
    "약을 털어넣",
    "약 털어넣",
    "약 모아",
    "약을 모아",
]

# 위험 강도 높은 표현
HIGH_RISK_KEYWORDS = [
    "더 이상 못 살겠어",
    "더이상못살겠어",
    "모든 걸 끝내고 싶어",
    "모든걸끝내고싶어",
    "고통스러워서 못 살겠어",
    "이 세상에서 사라지고",
]

# 복합 조건 트리거 키워드
COMPOUND_TRIGGER = [
    "끝내고 싶",
    "벗어나고 싶",
]

# 복합 조건 컨텍스트 키워드
COMPOUND_CONTEXT = [
    "고통",
    "힘들어",
    "살기",
    "아파",
    "괴로워",
    "지쳐",
    "못 버티",
]

# 일상 표현 (오탐 방지 제외 목록)
DAILY_EXPRESSIONS = [
    "힘들어 죽겠어",
    "힘들어죽겠어",
    "더워 죽겠어",
    "더워죽겠어",
    "배고파 죽겠어",
    "배고파죽겠어",
    "웃겨 죽겠어",
    "웃겨죽겠어",
    "졸려 죽겠어",
    "졸려죽겠어",
    "바빠 죽겠어",
    "바빠죽겠어",
    "이러다 죽는 거 아닌가요",
    "약이 독이 될 수 있나요",
    "운동이 힘들어서 끝내고 싶",
    "운동 끝내고 싶",
    "다이어트 끝내고 싶",
    "공부 끝내고 싶",
    "일 끝내고 싶",
]

# ── 안전 응답 템플릿 ──

SAFETY_RESPONSE = (
    "지금 많이 힘드신가요? "
    "MediPT는 복약 안내와 생활습관 가이드를 도와드리는 서비스예요. "
    "지금 느끼시는 감정에 대해서는 전문가의 도움을 받으시는 게 좋을 것 같아요. "
    "정신건강 위기상담 전화 109 (24시간)로 연락해 보세요. "
    "혼자 감당하지 않으셔도 돼요."
)

SAFETY_DISCLAIMER = (
    "본 응답은 사용자 안전을 위한 자동 안내입니다. 전문 상담사와 연결을 원하시면 109로 연락해 주세요."
)


def _normalize(text: str) -> str:
    """공백 제거 + 소문자 변환"""
    return text.replace(" ", "").lower()


def _check_keywords(normalized: str, keywords: list) -> bool:
    return any(_normalize(k) in normalized for k in keywords)


def check_safety(text: str) -> bool:
    """
    입력 텍스트에서 위험 키워드 감지 시 True 반환

    판단 기준
    1. 일상 표현 목록에 해당하면 SAFE
    2. 명시적 자살/자해 키워드 → 맥락 무관 DANGER
    3. 의료 맥락 위험 표현 → DANGER
    4. 위험 강도 높은 표현 → DANGER
    5. 복합 조건 (트리거 + 컨텍스트) → DANGER
    """
    if not text:
        return False

    normalized = _normalize(text)

    # 1. 일상 표현 먼저 체크 → SAFE 처리
    if _check_keywords(normalized, DAILY_EXPRESSIONS):
        return False

    # 2~4. 위험 키워드 체크
    if _check_keywords(normalized, EXPLICIT_DANGER_KEYWORDS):
        return True
    if _check_keywords(normalized, MEDICAL_DANGER_KEYWORDS):
        return True
    if _check_keywords(normalized, HIGH_RISK_KEYWORDS):
        return True

    # 5. 복합 조건 감지
    if _check_keywords(normalized, COMPOUND_TRIGGER):
        return _check_keywords(normalized, COMPOUND_CONTEXT)

    return False


def get_safety_response() -> dict:
    """safety_flag True 시 반환할 안전 응답"""
    return {
        "answer": SAFETY_RESPONSE,
        "safety_flag": True,
        "disclaimer": SAFETY_DISCLAIMER,
        "guide_items": [],
    }


def safe_chat_response(user_input: str, llm_response_fn) -> dict:
    """
    챗봇 응답 메인 함수
    위험 키워드 감지 시 안전 응답 즉시 반환
    정상 입력 시 LLM 응답 반환
    """
    if check_safety(user_input):
        return get_safety_response()
    return llm_response_fn(user_input)
