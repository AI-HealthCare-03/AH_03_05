from app.services.safety_filter import check_safety, get_safety_response


class TestCheckSafety:
    """TC-SAFE-001 키워드 필터 테스트"""

    def test_explicit_danger_keyword(self):
        assert check_safety("죽고 싶어요") is True

    def test_explicit_danger_keyword_2(self):
        assert check_safety("살기 싫어요") is True

    def test_medical_danger_keyword(self):
        assert check_safety("약을 많이 먹으면 어떻게 되나요?") is True

    def test_medical_danger_keyword_2(self):
        assert check_safety("약 왕창 먹으면") is True

    def test_high_risk_keyword(self):
        assert check_safety("더 이상 못 살겠어") is True

    def test_compound_condition(self):
        assert check_safety("고통스러워서 끝내고 싶어요") is True

    def test_daily_expression_safe(self):
        assert check_safety("힘들어 죽겠어") is False

    def test_daily_expression_safe_2(self):
        assert check_safety("더워 죽겠어") is False

    def test_normal_medical_question(self):
        assert check_safety("암로디핀 식전에 먹어도 되나요?") is False

    def test_normal_medical_question_2(self):
        assert check_safety("메트포르민 부작용이 뭐예요?") is False

    def test_empty_input(self):
        assert check_safety("") is False

    def test_none_like_input(self):
        assert check_safety("   ") is False


class TestGetSafetyResponse:
    """안전 응답 형식 검증"""

    def test_safety_response_format(self):
        result = get_safety_response()
        assert result["safety_flag"] is True
        assert "109" in result["answer"]
        assert "disclaimer" in result
        assert result["guide_items"] == []
