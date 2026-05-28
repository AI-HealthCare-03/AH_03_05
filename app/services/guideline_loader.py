import os

# 질환 코드 → 로어북 파일 매핑
DISEASE_LORE_MAP = {
    # 고혈압
    "고혈압": {"young": "hypertension_young", "old": "hypertension_old"},
    "I10": {"young": "hypertension_young", "old": "hypertension_old"},
    # 당뇨병
    "당뇨병": {"young": "diabetes_young", "old": "diabetes_old"},
    "제2형 당뇨병": {"young": "diabetes_young", "old": "diabetes_old"},
    "E11": {"young": "diabetes_young", "old": "diabetes_old"},
    # 이상지질혈증
    "이상지질혈증": {"all": "dyslipidemia"},
    "고지혈증": {"all": "dyslipidemia"},
    "E78": {"all": "dyslipidemia"},
    # 만성콩팥병
    "만성콩팥병": {"all": "chronic_kidney"},
    "N18": {"all": "chronic_kidney"},
    # 심방세동
    "심방세동": {"all": "atrial_fibrillation"},
    "I48": {"all": "atrial_fibrillation"},
    # 우울증
    "우울증": {"all": "depression"},
    "F32": {"all": "depression"},
    "F33": {"all": "depression"},
    # 천식
    "천식": {"all": "asthma"},
    "J45": {"all": "asthma"},
    # COPD
    "만성폐쇄성폐질환": {"all": "copd"},
    "COPD": {"all": "copd"},
    "J44": {"all": "copd"},
}

LORE_DIR = "docs/guidelines/lore"

# age_group 문자열 → 숫자 변환 매핑
# 두 형태 모두 지원 ("30s" / "30대")
# 60대는 65로 매핑 → old 로어북 적용 (의료 안전 기준 보수적 처리)
AGE_GROUP_MAP = {
    "10s": 15,
    "20s": 25,
    "30s": 35,
    "40s": 45,
    "50s": 55,
    "60s": 65,
    "70s": 75,
    "80s": 85,
    "10대": 15,
    "20대": 25,
    "30대": 35,
    "40대": 45,
    "50대": 55,
    "60대": 65,
    "70대": 75,
    "80대": 85,
}


def parse_age(age_group: str | int) -> int:
    """
    age_group 문자열 또는 숫자를 정수로 변환
    "30대" / "30s" / 55 모두 처리 가능
    """
    if isinstance(age_group, int):
        return age_group
    if str(age_group).isdigit():
        return int(age_group)
    return AGE_GROUP_MAP.get(str(age_group), 50)


def load_lore(filename: str) -> str:
    """로어북 텍스트 파일 로드"""
    path = os.path.join(LORE_DIR, f"{filename}.txt")
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8") as f:
        return f.read()


def get_guideline_context(chronic_diseases: list, age_group: str | int) -> str:
    """
    건강 프로필의 만성질환 목록과 나이를 받아
    해당하는 가이드라인 로어북을 조합하여 반환
    """
    age = parse_age(age_group)
    loaded = set()
    context_parts = []

    for disease in chronic_diseases:
        mapping = DISEASE_LORE_MAP.get(disease)
        if not mapping:
            continue

        if "all" in mapping:
            key = mapping["all"]
        else:
            key = mapping["old"] if age >= 65 else mapping["young"]

        if key in loaded:
            continue

        lore_text = load_lore(key)
        if lore_text:
            context_parts.append(f"[{disease} 가이드라인]\n{lore_text}")
            loaded.add(key)

    if not context_parts:
        return ""

    return "\n\n---\n\n".join(context_parts)


def get_disease_names(diseases: list) -> list:
    """질환 코드를 질환명으로 변환"""
    code_to_name = {
        "I10": "고혈압",
        "E11": "제2형 당뇨병",
        "E78": "이상지질혈증",
        "N18": "만성콩팥병",
        "I48": "심방세동",
        "F32": "우울증",
        "F33": "우울증",
        "J45": "천식",
        "J44": "만성폐쇄성폐질환",
    }
    return [code_to_name.get(d, d) for d in diseases]
