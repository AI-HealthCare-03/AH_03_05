"""
식약처(MFDS) 의약품안전나라 API 응답 mock fixtures.

실제 API 응답을 흉내낸 dict 샘플들.
client.search_drug() / client.get_drug_detail() 호출의 반환값으로 사용된다.
"""

# search_drug() 응답: list[dict] 반환
SEARCH_TYLENOL = [
    {
        "ITEM_SEQ": "197600020",
        "ITEM_NAME": "타이레놀정500mg",
        "ENTP_NAME": "한국얀센",
        "ITEM_INGR_NAME": "아세트아미노펜",
        "MAIN_INGR_NAME": "아세트아미노펜",
        "UD_DOC_DATA": "성인 1회 1정, 1일 3-4회 복용.",
        "EE_DOC_DATA": "감기로 인한 발열 및 동통, 두통, 신경통.",
        "NB_DOC_DATA": "간장애 환자에게 주의. 1일 4000mg 초과 복용 금지.",
        "SIDE_EFFECT": "드물게 발진, 구역, 구토.",
    },
    {
        "ITEM_SEQ": "199900158",
        "ITEM_NAME": "타이레놀이알서방정",
        "ENTP_NAME": "한국얀센",
        "ITEM_INGR_NAME": "아세트아미노펜",
        "MAIN_INGR_NAME": "아세트아미노펜",
        "UD_DOC_DATA": "성인 1회 2정, 1일 3회 복용.",
        "EE_DOC_DATA": "관절통, 근육통, 요통의 일시적 완화.",
        "NB_DOC_DATA": "간장애 환자에게 주의.",
        "SIDE_EFFECT": "드물게 발진.",
    },
]

SEARCH_EMPTY = []

# get_drug_detail() 응답: dict 단일 (없으면 None)
DETAIL_TYLENOL = {
    "ITEM_SEQ": "197600020",
    "ITEM_NAME": "타이레놀정500mg",
    "ENTP_NAME": "한국얀센",
    "ITEM_INGR_NAME": "아세트아미노펜",
    "MAIN_INGR_NAME": "아세트아미노펜",
    "UD_DOC_DATA": "성인 1회 1정, 1일 3-4회 복용.",
    "EE_DOC_DATA": "감기로 인한 발열 및 동통, 두통, 신경통.",
    "NB_DOC_DATA": "간장애 환자에게 주의. 1일 4000mg 초과 복용 금지.",
    "SIDE_EFFECT": "드물게 발진, 구역, 구토.",
}

DETAIL_NONE = None
