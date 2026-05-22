import pytest
from app.services.llm_service import generate_guide


class TestGenerateGuide:
    """TC-LLM-001 복약 가이드 생성 테스트"""

    @pytest.fixture
    def health_profile_hypertension(self):
        return {
            "age_group": "50대",
            "chronic_diseases": ["고혈압"],
            "current_medications": [
                {
                    "drug_name": "암로디핀정 5mg",
                    "ingredient_name": "암로디핀베실산염",
                    "efficacy": "칼슘채널차단제. 혈압강하 및 항협심증 작용",
                    "caution": "임부 또는 임신 가능성이 있는 여성에게 투여하지 않는 것이 바람직함",
                    "frequency": "1일 1회",
                    "timing": "아침 식후",
                }
            ],
            "doctor_opinion": "저염식 권고.",
        }

    @pytest.fixture
    def health_profile_diabetes(self):
        return {
            "age_group": "60대",
            "chronic_diseases": ["제2형 당뇨병"],
            "current_medications": [
                {
                    "drug_name": "메트포르민 500mg",
                    "ingredient_name": "메트포르민염산염",
                    "efficacy": "혈당강하제. 간에서 포도당 생성 억제",
                    "caution": "신기능 장애 환자에게 주의. 조영제 검사 전 복용 중단 필요",
                    "frequency": "1일 2회",
                    "timing": "식후 30분",
                }
            ],
            "doctor_opinion": "규칙적인 운동 권고.",
        }

    @pytest.fixture
    def health_profile_over65(self):
        return {
            "age_group": "70대",
            "chronic_diseases": ["고혈압"],
            "current_medications": [
                {
                    "drug_name": "암로디핀정 5mg",
                    "frequency": "1일 1회",
                    "timing": "아침 식후",
                }
            ],
            "doctor_opinion": "",
        }

    def test_response_has_medication_guide(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        assert result["medication_guide"] != ""

    def test_response_has_lifestyle_guide(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        assert result["lifestyle_guide"] != ""

    def test_response_has_disclaimer(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        assert "임상진료지침" in result["disclaimer"]

    def test_safety_flag_false(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        assert result["safety_flag"] is False

    def test_logic_not_in_response(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        assert "_logic" not in result

    def test_generation_status_completed(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        assert result["generation_status"]["medication"] == "completed"
        assert result["generation_status"]["lifestyle"] == "completed"

    def test_guide_items_not_empty(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        assert len(result["guide_items"]) > 0

    def test_guide_items_sort_order(self, health_profile_hypertension):
        result = generate_guide(health_profile_hypertension)
        orders = [item["sort_order"] for item in result["guide_items"]]
        assert orders == sorted(orders)

    def test_warning_for_pregnancy(self):
        health_profile = {
            "age_group": "30대",
            "chronic_diseases": ["고혈압"],
            "current_medications": [
                {
                    "drug_name": "암로디핀정 5mg",
                    "caution": "임부 또는 임신 가능성이 있는 여성에게 투여하지 않는 것이 바람직함",
                    "frequency": "1일 1회",
                    "timing": "아침 식후",
                }
            ],
            "doctor_opinion": "",
        }
        result = generate_guide(health_profile)
        item_types = [item["item_type"] for item in result["guide_items"]]
        assert "WARNING" in item_types

    def test_age_group_over65_uses_old_lore(self, health_profile_over65):
        result = generate_guide(health_profile_over65)
        assert result["medication_guide"] != ""

    def test_diabetes_guide(self, health_profile_diabetes):
        result = generate_guide(health_profile_diabetes)
        assert result["medication_guide"] != ""
        assert result["lifestyle_guide"] != ""
