"""
safety_filter.check_safety() 단위 테스트.

목적: 위기 신호(자살/자해/약물 과량 등)가 들어오면 True를 반환해
안전 응답으로 분기되는지, 일상 표현은 False로 통과하는지 검증한다.

주의: 이 파일은 감지 로직 검증용 대표 표현만 포함한다.
자해 수단·방법을 나열하는 사전이 아니다.
"""

import pytest

from app.services.safety_filter import check_safety, get_safety_response

# ──────────────────────────────────────────────
# 1. 위험 감지 (True 기대) — v1에서 이미 통과하는 케이스
# ──────────────────────────────────────────────
DANGER_DETECTED_V1 = [
    "자살하고 싶어요",
    "자해했어요",
    "죽고 싶어요",
    "약을 한꺼번에 다 먹으면 어떻게 되나요",
    "과량 복용하면",
    "더 이상 못 살겠어",
    "모든 걸 끝내고 싶어",
    # v2 보완: 미탐 케이스
    "죽어버릴까",
    "뛰어내리고 싶어",
    "약 다 털어넣고 싶어",
]


@pytest.mark.parametrize("text", DANGER_DETECTED_V1)
def test_danger_detected_v1(text):
    assert check_safety(text) is True


# ──────────────────────────────────────────────
# 2. 일상 표현 (False 기대) — 오탐 방지
# ──────────────────────────────────────────────
SAFE_DAILY = [
    "힘들어 죽겠어요",
    "더워 죽겠어요",
    "배고파 죽겠어요",
    "졸려 죽겠어요",
    "이 약 먹으면 졸려 죽겠어요",
    "약 끊고 싶어요",
    "이 증상 너무 힘들어요",
    "고혈압 있는데 삼겹살 먹어도 돼요",
    # v2 보완: 오탐 케이스
    "운동이 힘들어서 끝내고 싶어요",
]


@pytest.mark.parametrize("text", SAFE_DAILY)
def test_safe_daily_expressions(text):
    assert check_safety(text) is False


# ──────────────────────────────────────────────
# 3. 빈 입력 / 엣지 케이스
# ──────────────────────────────────────────────
def test_empty_string():
    assert check_safety("") is False


def test_none_like_whitespace():
    assert check_safety("   ") is False


# ──────────────────────────────────────────────
# 4. 안전 응답 구조 검증
# ──────────────────────────────────────────────
def test_safety_response_structure():
    resp = get_safety_response()
    assert resp["safety_flag"] is True
    assert "109" in resp["answer"]
    assert "disclaimer" in resp
    assert resp["guide_items"] == []
