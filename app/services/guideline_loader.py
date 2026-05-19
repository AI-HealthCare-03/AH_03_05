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


def load_lore(filename: str) -> str:
    """로어북 텍스트 파일 로드"""
    path = os.path.join(LORE_DIR, f"{filename}.txt")
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def get_guideline_context(chronic_diseases: list, age: int) -> str:
    """
    건강 프로필의 만성질환 목록과 나이를 받아
    해당하는 가이드라인 로어북을 조합하여 반환
    """
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


def get_disease_names(chronic_diseases: list) -> list:
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
    return [code_to_name.get(d, d) for d in chronic_diseases]
