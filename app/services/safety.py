RISK_KEYWORDS = [
    "약 끊어",
    "약을 끊어",
    "약 중단",
    "약을 중단",
    "복용 중단",
    "복용을 중단",
    "그만 먹어",
    "안 먹어도",
    "끊어도 되",
    "중단해도 되",
    "두 알",
    "2알",
    "많이 먹어",
    "더 먹어",
    "용량 늘려",
    "용량을 늘려",
    "용량 줄여",
    "용량을 줄여",
    "부작용 심한데",
    "부작용이 심한데",
    "숨이 차",
    "호흡곤란",
    "응급",
    "어지러워",
    "실신",
    "가슴 통증",
]


def detect_risk_question(message: str) -> dict:
    normalized_message = message.replace(" ", "").lower()

    matched_keywords = [
        keyword for keyword in RISK_KEYWORDS
        if keyword.replace(" ", "").lower() in normalized_message
    ]

    if matched_keywords:
        return {
            "safety_flag": True,
            "matched_keywords": matched_keywords,
            "safety_notice": (
                "복약 중단, 용량 변경, 응급 증상과 관련된 내용은 "
                "반드시 의료진 또는 약사와 상담해주세요. "
                "이 챗봇은 전문의의 진료를 대체할 수 없습니다."
            ),
        }

    return {
        "safety_flag": False,
        "matched_keywords": [],
        "safety_notice": None,
    }