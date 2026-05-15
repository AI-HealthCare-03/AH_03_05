"""
식약처 의약품안전나라 API 클라이언트.
공공데이터포털 - 의약품 제품 허가 정보 서비스 기반.
https://www.data.go.kr/data/15095677/openapi.do
"""

import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

MFDS_API_KEY = os.getenv("MFDS_API_KEY")

# 식약처 의약품 제품 허가정보 서비스 v07
MFDS_BASE_URL = "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07"

# 검색 / 상세조회 엔드포인트
MFDS_SEARCH_URL = f"{MFDS_BASE_URL}/getDrugPrdtPrmsnInq07"
MFDS_DETAIL_URL = f"{MFDS_BASE_URL}/getDrugPrdtPrmsnDtlInq07"

DEFAULT_TIMEOUT = 30.0


class MFDSClient:
    """식약처 API 호출 클라이언트"""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or MFDS_API_KEY

        if not self.api_key:
            raise ValueError("MFDS_API_KEY가 설정되지 않았습니다. .env 확인 필요.")

    async def search_drug(
        self,
        keyword: str,
        num_of_rows: int = 10,
    ) -> list[dict[str, Any]]:
        """
        약품명으로 식약처 의약품 제품 허가정보를 검색한다.
        """
        if not keyword.strip():
            return []

        params = {
            "serviceKey": self.api_key,
            "pageNo": 1,
            "numOfRows": num_of_rows,
            "type": "json",
            "item_name": keyword,
        }

        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.get(MFDS_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()

        return self._extract_items(data)

    async def get_drug_detail(self, item_seq: str) -> dict[str, Any] | None:
        """
        약품 식별 코드(ITEM_SEQ)로 상세 조회한다.
        """
        if not item_seq:
            return None

        params = {
            "serviceKey": self.api_key,
            "item_seq": item_seq,
            "type": "json",
        }

        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.get(MFDS_DETAIL_URL, params=params)
            response.raise_for_status()
            data = response.json()

        items = self._extract_items(data)

        if not items:
            return None

        return items[0]

    @staticmethod
    def _extract_items(data: dict[str, Any]) -> list[dict[str, Any]]:
        """
        식약처 API 응답에서 items만 안전하게 추출한다.
        """
        body = data.get("body") or {}
        items = body.get("items") or []

        if isinstance(items, list):
            return items

        if isinstance(items, dict):
            return [items]

        return []


def map_mfds_response_to_drug_reference(item: dict[str, Any]) -> dict[str, Any]:
    """
    식약처 API 응답 한 건을 약품 검색 응답 구조로 매핑한다.

    검색 API 응답에는 효능/용법/주의사항 상세 문서가 없을 수 있으므로,
    상세 설명 필드는 None으로 두고 약품 검색 카드에 필요한 기본 정보 중심으로 매핑한다.
    """
    manufacturer = item.get("ENTP_NAME") or "제조사 정보 없음"

    return {
        "drug_code": item.get("ITEM_SEQ"),
        "drug_name": item.get("ITEM_NAME") or "이름 없음",
        "ingredient_name": item.get("ITEM_INGR_NAME") or item.get("MAIN_INGR_NAME"),
        "manufacturer": manufacturer,
        "dosage": item.get("PRODUCT_TYPE"),
        "efficacy": item.get("EE_DOC_DATA"),
        "usage_method": item.get("UD_DOC_DATA"),
        "caution": item.get("NB_DOC_DATA"),
        "side_effect": item.get("SIDE_EFFECT"),
        "source": "MFDS",
        "source_url": "https://www.data.go.kr/data/15095677/openapi.do",
        "raw_response": item,
    }