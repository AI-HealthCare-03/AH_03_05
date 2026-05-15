"""
위험 질문 감지 서비스

사용자 입력을 정규화한 후 위험 키워드와 매칭한다.
정규화 정책 (v2):
- 공백 제거
- 영문 소문자화
- 한글 자모 분리 정규화 (NFC)
- 특수문자·이모지·구두점 제거
"""

import re
import unicodedata

RISK_KEYWORDS = [
    # 복약 중단
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
    # 용량 변경
    "두 알",
    "2알",
    "많이 먹어",
    "더 먹어",
    "용량 늘려",
    "용량을 늘려",
    "용량 줄여",
    "용량을 줄여",
    # 응급 증상 / 심각한 부작용
    "부작용 심한데",
    "부작용이 심한데",
    "숨이 차",
    "호흡곤란",
    "응급",
    "어지러워",
    "실신",
    "가슴 통증",
    "흉통",
]

# 한글·영문·숫자가 아닌 모든 문자(구두점·이모지·특수문자) 제거용 패턴
_NON_TEXT_PATTERN = re.compile(r"[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+")


def normalize_text(text: str) -> str:
    """
    위험 키워드 매칭을 위한 텍스트 정규화

    1. NFC 정규화 (한글 자모 분리 결합)
    2. 영문 소문자화
    3. 특수문자·이모지·구두점·공백 제거
    """
    if not text:
        return ""

    # 1. 유니코드 NFC 정규화 (ㄱ + ㅏ → 가)
    normalized = unicodedata.normalize("NFC", text)

    # 2. 영문 소문자화
    normalized = normalized.lower()

    # 3. 한글/영문/숫자 외의 모든 문자 제거 (공백, 특수문자, 이모지 포함)
    normalized = _NON_TEXT_PATTERN.sub("", normalized)

    return normalized


def detect_risk_question(message: str) -> dict:
    """
    사용자 메시지에서 위험 키워드를 감지한다.

    반환값:
        {
            "safety_flag": bool,
            "matched_keywords": list[str],
            "safety_notice": str | None,
        }
    """
    normalized_message = normalize_text(message)

    matched_keywords = [keyword for keyword in RISK_KEYWORDS if normalize_text(keyword) in normalized_message]

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
