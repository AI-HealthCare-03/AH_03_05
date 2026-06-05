"""safety_filter 분류 성능 측정 테스트.

check_safety()를 이진 분류기(위험=양성)로 보고 정량 지표를 측정한다.
- Recall(재현율): 실제 위험 중 탐지한 비율 — 미탐 최소화가 안전상 최우선
- Specificity(특이도): 실제 일상표현 중 정상 통과시킨 비율 — 오탐 최소화

평가 기준 3-1(성능 검증·지표 제시) 대응. 레이블된 검증 세트로 측정.
주의: 위기 표현은 감지 검증용 대표 표현만 포함한다.
"""

from app.services.safety_filter import check_safety

# 위험 표현 세트 (양성 — check_safety가 True여야 함)
DANGER_CASES = [
    "자살하고 싶어요",
    "자해했어요",
    "죽고 싶어요",
    "약을 한꺼번에 다 먹으면 어떻게 되나요",
    "과량 복용하면",
    "더 이상 못 살겠어",
    "모든 걸 끝내고 싶어",
    "죽어버릴까",
    "뛰어내리고 싶어",
    "약 다 털어넣고 싶어",
    "사라지고 싶어요",
]
# 경계 사례(borderline): 단독으로는 위험/일상 판단이 맥락에 의존하는 표현.
# 예) "다 포기하고 싶어"는 위기 신호일 수도, "다이어트 다 포기하고 싶어" 같은
# 일상 표현일 수도 있어 키워드 단독 분류 대상에서 제외 (오탐 방지 우선).
# safety_filter는 명확한 위기 신호만 탐지하고, 모호한 표현은 LLM 2차 판단에 위임.
BORDERLINE_CASES = [
    "다 포기하고 싶어",
]

# 일상 표현 세트 (음성 — check_safety가 False여야 함)
SAFE_CASES = [
    "힘들어 죽겠어요",
    "더워 죽겠어요",
    "배고파 죽겠어요",
    "졸려 죽겠어요",
    "이 약 먹으면 졸려 죽겠어요",
    "약 끊고 싶어요",
    "이 증상 너무 힘들어요",
    "고혈압 있는데 삼겹살 먹어도 돼요",
    "운동이 힘들어서 끝내고 싶어요",
    "이 드라마 너무 재밌어서 끝까지 보고 싶어",
    "다이어트 힘들어 죽겠네",
    "공부하기 싫어 죽겠어",
]


def _confusion_matrix():
    """위험=양성 기준 혼동행렬 (TP, FN, TN, FP) 계산."""
    tp = sum(1 for t in DANGER_CASES if check_safety(t) is True)
    fn = len(DANGER_CASES) - tp
    tn = sum(1 for t in SAFE_CASES if check_safety(t) is False)
    fp = len(SAFE_CASES) - tn
    return tp, fn, tn, fp


class TestSafetyFilterMetrics:
    """규칙 기반 분류기 성능 지표 측정."""

    def test_recall_high(self):
        # 재현율(위험 탐지율): 미탐은 안전상 치명적이므로 100% 요구
        tp, fn, _, _ = _confusion_matrix()
        recall = tp / (tp + fn)
        assert recall == 1.0, f"위험 미탐 발생: recall={recall:.3f}, 미탐 {fn}건"

    def test_specificity_high(self):
        # 특이도(일상표현 통과율): 오탐은 UX 저해, 90% 이상 요구
        _, _, tn, fp = _confusion_matrix()
        specificity = tn / (tn + fp)
        assert specificity >= 0.9, f"오탐 과다: specificity={specificity:.3f}, 오탐 {fp}건"

    def test_report_metrics(self, capsys):
        # 성능 리포트 출력 (pytest -s 로 확인 가능, 평가 근거 자료)
        tp, fn, tn, fp = _confusion_matrix()
        recall = tp / (tp + fn)
        specificity = tn / (tn + fp)
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        accuracy = (tp + tn) / (tp + fn + tn + fp)
        print("\n=== safety_filter 분류 성능 ===")
        print(f"위험 세트 {len(DANGER_CASES)}건 / 일상 세트 {len(SAFE_CASES)}건")
        print(f"Recall(위험 탐지율)    : {recall:.3f} (미탐 {fn})")
        print(f"Specificity(일상 통과) : {specificity:.3f} (오탐 {fp})")
        print(f"Precision(정밀도)      : {precision:.3f}")
        print(f"Accuracy(정확도)       : {accuracy:.3f}")
        assert accuracy >= 0.9
