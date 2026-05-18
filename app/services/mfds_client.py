"""
식약처 의약품안전나라 API 클라이언트.
공공데이터포털 - 의약품 제품 허가 정보 서비스 기반.
https://www.data.go.kr/data/15095677/openapi.do
"""

from typing import Any

import httpx

from app.core import config

MFDS_BASE_URL = "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07"
MFDS_SEARCH_URL = f"{MFDS_BASE_URL}/getDrugPrdtPrmsnInq07"
MFDS_DETAIL_URL = f"{MFDS_BASE_URL}/getDrugPrdtPrmsnDtlInq07"
DEFAULT_TIMEOUT = 30.0


class MFDSClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or config.MFDS_API_KEY

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
        503 에러 방지를 위해 ITEM_SEQ 대문자 파라미터를 사용한다.
        """
        if not item_seq:
            return None

        params = {
            "serviceKey": self.api_key,
            "ITEM_SEQ": item_seq,  # 팀장님 수정 사항 반영
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
    식약처 API 응답을 유정님이 확장한 MedicationCandidate DTO 구조에 맞춰 매핑한다.
    """
    manufacturer = item.get("ENTP_NAME") or "제조사 정보 없음"

    return {
        # 기본 정보
        "drug_code": item.get("ITEM_SEQ"),
        "drug_name": item.get("ITEM_NAME") or "이름 없음",
        "ingredient_name": item.get("ITEM_INGR_NAME") or item.get("MAIN_INGR_NAME"),
        "manufacturer": manufacturer,
        # [유정님 PR #27 반영] 상세 데이터 매핑
        "dosage": item.get("UD_DOC_DATA"),  # 용법용량
        "efficacy": item.get("EE_DOC_DATA"),  # 효능효과
        "caution": item.get("NB_DOC_DATA"),  # 주의사항 (안건 4 반영)
        "side_effect": item.get("SIDE_EFFECT"),  # 부작용
        # 추가 필드 (DTO 매칭)
        "drug_ref_id": item.get("ITEM_SEQ"),  # 식약처 코드 연결용
        "source": "MFDS",
        "source_url": "https://www.data.go.kr/data/15095677/openapi.do",
        "raw_response": item,
    }
