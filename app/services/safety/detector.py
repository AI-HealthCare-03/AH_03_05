"""위험 질문 감지 + 텍스트 정규화

정규화 정책 (v2):
- NFC 한글 자모 결합
- 영문 소문자화
- 이모지·특수문자·구두점 제거
- 공백 정규화
"""

import re
import unicodedata

from .keywords import RISK_KEYWORDS


def normalize_text(text: str) -> str:
    """텍스트 정규화"""
    text = unicodedata.normalize("NFC", text)
    text = text.lower()
    text = re.sub(r"[^\w\s가-힣]", "", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def detect_risk_question(text: str) -> bool:
    """위험 질문 감지: 정규화 후 키워드 매칭"""
    normalized = normalize_text(text)
    return any(keyword in normalized for keyword in RISK_KEYWORDS)
