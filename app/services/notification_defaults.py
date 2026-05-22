import re
from datetime import time

# ── 복용 시간 키워드 → 알림 시간 매핑 ──
# 긴 키워드가 먼저 매칭되도록 길이 내림차순 정렬
TIMING_MAP = {
    "자기 전": time(21, 0),
    "잠자리": time(21, 0),
    "취침": time(21, 0),
    "아침": time(8, 0),
    "오전": time(8, 0),
    "점심": time(13, 0),
    "저녁": time(19, 0),
    "오후": time(19, 0),
    "낮": time(13, 0),
}

# 길이 내림차순 정렬된 키워드 리스트
TIMING_KEYWORDS_SORTED = sorted(TIMING_MAP.keys(), key=len, reverse=True)

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
    정규식으로 "1일 X회" / "하루 X번" / "주 X회" 패턴 안전하게 추출
    "2일에 1회" 같은 기간 조건 오인식 방지
    """
    if not frequency:
        return 1

    # 1일 N회 / 하루 N번 / 매일 N회 패턴
    daily_patterns = [
        r"1일\s*(\d+)\s*회",
        r"하루\s*(\d+)\s*번",
        r"하루\s*(\d+)\s*회",
        r"매일\s*(\d+)\s*회",
        r"매일\s*(\d+)\s*번",
    ]
    for pattern in daily_patterns:
        match = re.search(pattern, frequency)
        if match:
            return int(match.group(1))

    # 주 N회 패턴 → 1 반환
    if re.search(r"주\s*(\d+)\s*회", frequency):
        return 1

    # N일에 1회 패턴 → 1 반환
    if re.search(r"(\d+)일에\s*\d+\s*회", frequency):
        return 1

    return 1


def parse_timing(timing: str) -> list[time]:
    """
    복용 시간 문자열에서 알림 시간 추출
    긴 키워드 우선 매칭으로 선점 버그 방지
    """
    if not timing:
        return []
    for keyword in TIMING_KEYWORDS_SORTED:
        if keyword in timing:
            return [TIMING_MAP[keyword]]
    return []


def get_medication_alarm_times(frequency: str, timing: str) -> list[str]:
    """
    복용법에서 알림 시간 목록 생성
    반환 형식: ["08:00", "19:00"]
    """
    times = parse_timing(timing)

    if times:
        freq = parse_frequency(frequency)
        if freq > 1:
            default_times = FREQUENCY_DEFAULT_TIMES.get(freq, [time(8, 0)])
            times = default_times
    else:
        freq = parse_frequency(frequency)
        times = FREQUENCY_DEFAULT_TIMES.get(freq, [time(8, 0)])

    return [t.strftime("%H:%M") for t in times]


def generate_notification_defaults(health_profile: dict) -> dict:
    """
    건강 프로필 기반 알림 기본값 생성
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
