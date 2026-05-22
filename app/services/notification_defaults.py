from datetime import time

# ── 복용 시간 키워드 → 알림 시간 매핑 ──

TIMING_MAP = {
    # 아침
    "아침": time(8, 0),
    "오전": time(8, 0),
    # 점심
    "점심": time(13, 0),
    "낮": time(13, 0),
    # 저녁
    "저녁": time(19, 0),
    "오후": time(19, 0),
    # 취침
    "취침": time(21, 0),
    "자기 전": time(21, 0),
    "잠자리": time(21, 0),
}

# 1일 N회 기본 알림 시간
FREQUENCY_DEFAULT_TIMES = {
    1: [time(8, 0)],
    2: [time(8, 0), time(19, 0)],
    3: [time(8, 0), time(13, 0), time(19, 0)],
    4: [time(8, 0), time(12, 0), time(18, 0), time(21, 0)],
}


def parse_frequency(frequency: str) -> int:
    """
    복용 횟수 문자열에서 숫자 추출
    "1일 1회" → 1
    "1일 2회" → 2
    "하루 3번" → 3
    """
    if not frequency:
        return 1
    for num in ["4", "3", "2", "1"]:
        if num in frequency:
            return int(num)
    return 1


def parse_timing(timing: str) -> list[time]:
    """
    복용 시간 문자열에서 알림 시간 추출
    "아침 식후" → [08:00]
    "식후 30분" → [] (횟수 기반으로 처리)
    """
    if not timing:
        return []
    for keyword, alarm_time in TIMING_MAP.items():
        if keyword in timing:
            return [alarm_time]
    return []


def get_medication_alarm_times(frequency: str, timing: str) -> list[str]:
    """
    복용법에서 알림 시간 목록 생성
    반환 형식: ["08:00", "19:00"]
    """
    # 1. timing 키워드로 시간 추출
    times = parse_timing(timing)

    if times:
        freq = parse_frequency(frequency)
        if freq > 1:
            default_times = FREQUENCY_DEFAULT_TIMES.get(freq, [time(8, 0)])
            times = default_times

    else:
        # 2. timing 키워드 없으면 횟수 기반 기본값
        freq = parse_frequency(frequency)
        times = FREQUENCY_DEFAULT_TIMES.get(freq, [time(8, 0)])

    return [t.strftime("%H:%M") for t in times]


def generate_notification_defaults(health_profile: dict) -> dict:
    """
    건강 프로필 기반 알림 기본값 생성

    반환 형식
    {
        "guide_complete": {"enabled": True},
        "medications": [
            {
                "drug_name": "암로디핀정 5mg",
                "alarm_times": ["08:00"],
                "enabled": True
            }
        ],
        "lifestyle_reminder": {"enabled": False, "time": "09:00"}
    }
    """
    medications = health_profile.get("current_medications") or health_profile.get("medications") or []

    med_notifications = []
    for med in medications:
        drug_name = med.get("drug_name", "")
        frequency = med.get("frequency", "")
        timing = med.get("timing", "")

        alarm_times = get_medication_alarm_times(frequency, timing)

        med_notifications.append(
            {
                "drug_name": drug_name,
                "alarm_times": alarm_times,
                "enabled": True,
            }
        )

    return {
        "guide_complete": {
            "enabled": True,
        },
        "medications": med_notifications,
        "lifestyle_reminder": {
            "enabled": False,
            "time": "09:00",
        },
    }
