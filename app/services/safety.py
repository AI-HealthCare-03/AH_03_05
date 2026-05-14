RISK_KEYWORDS = [
    "약 끊어",
    "복용 중단",
    "두 알",
    "용량 늘려",
    "용량 줄여",
    "부작용 심한데",
    "숨이 차",
    "응급",
    "어지러워",
]


def detect_risk_question(message: str) -> dict:
    matched_keywords = [
        keyword for keyword in RISK_KEYWORDS
        if keyword in message
    ]

    if matched_keywords:
        return {
            "safety_flag": True,
            "matched_keywords": matched_keywords,
            "safety_notice": (
                "복약 중단, 용량 변경, 응급 증상과 관련된 내용은 "
                "반드시 의료진과 상담해주세요. "
                "이 챗봇은 전문의의 진료를 대체할 수 없습니다."
            ),
        }

    return {
        "safety_flag": False,
        "matched_keywords": [],
        "safety_notice": None,
    }