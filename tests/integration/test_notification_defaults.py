import pytest
from app.services.notification_defaults import (
    parse_frequency,
    parse_timing,
    get_medication_alarm_times,
    generate_notification_defaults,
)


class TestParseFrequency:
    """TC-NOTIFY-001 복용 횟수 파싱 테스트"""

    def test_1day_1time(self):
        assert parse_frequency("1일 1회") == 1

    def test_1day_2times(self):
        assert parse_frequency("1일 2회") == 2

    def test_daily_3times(self):
        assert parse_frequency("하루 3번") == 3

    def test_everyday_2times(self):
        assert parse_frequency("매일 2번") == 2

    def test_interval_2days(self):
        assert parse_frequency("2일에 1회") == 1

    def test_weekly(self):
        assert parse_frequency("주 3회") == 1

    def test_empty(self):
        assert parse_frequency("") == 1

    def test_irregular(self):
        assert parse_frequency("필요시") == 1


class TestParseTiming:
    """복용 시간 키워드 파싱 테스트"""

    def test_morning(self):
        from datetime import time

        assert parse_timing("아침 식후") == [time(8, 0)]

    def test_evening(self):
        from datetime import time

        assert parse_timing("저녁 식후") == [time(19, 0)]

    def test_bedtime(self):
        from datetime import time

        assert parse_timing("자기 전") == [time(21, 0)]

    def test_no_keyword(self):
        assert parse_timing("식후 30분") == []

    def test_empty(self):
        assert parse_timing("") == []


class TestGetMedicationAlarmTimes:
    """알림 시간 생성 테스트"""

    def test_morning_1time(self):
        assert get_medication_alarm_times("1일 1회", "아침 식후") == ["08:00"]

    def test_2times_default(self):
        assert get_medication_alarm_times("1일 2회", "식후 30분") == ["08:00", "19:00"]

    def test_3times_default(self):
        assert get_medication_alarm_times("1일 3회", "식후 30분") == ["08:00", "13:00", "19:00"]

    def test_evening_2times(self):
        assert get_medication_alarm_times("1일 2회", "아침 식후") == ["08:00", "19:00"]


class TestGenerateNotificationDefaults:
    """알림 기본값 생성 테스트"""

    def test_guide_complete_enabled(self):
        result = generate_notification_defaults({})
        assert result["guide_complete"]["enabled"] is True

    def test_lifestyle_reminder_disabled(self):
        result = generate_notification_defaults({})
        assert result["lifestyle_reminder"]["enabled"] is False

    def test_medication_alarm_generated(self):
        health_profile = {
            "current_medications": [
                {"drug_name": "암로디핀정 5mg", "frequency": "1일 1회", "timing": "아침 식후"},
            ]
        }
        result = generate_notification_defaults(health_profile)
        assert len(result["medications"]) == 1
        assert result["medications"][0]["alarm_times"] == ["08:00"]
        assert result["medications"][0]["enabled"] is True

    def test_fallback_medications_field(self):
        health_profile = {
            "medications": [
                {"drug_name": "메트포르민 500mg", "frequency": "1일 2회", "timing": "식후 30분"},
            ]
        }
        result = generate_notification_defaults(health_profile)
        assert len(result["medications"]) == 1
        assert result["medications"][0]["alarm_times"] == ["08:00", "19:00"]

    def test_empty_medications(self):
        result = generate_notification_defaults({})
        assert result["medications"] == []
