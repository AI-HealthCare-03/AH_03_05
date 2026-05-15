from fastapi import APIRouter, HTTPException
import httpx

from app.services.mfds_client import MFDSClient, map_mfds_response_to_drug_reference

drug_router = APIRouter(prefix="/drugs", tags=["Drugs"])


@drug_router.get("/search")
async def search_drugs(keyword: str, limit: int = 10):
    """
    식약처 API 기반 약품 검색 API.

    - keyword: 검색할 약품명
    - limit: 검색 결과 개수
    """
    if not keyword.strip():
        return {
            "keyword": keyword,
            "source": "MFDS",
            "cache_used": False,
            "results": [],
            "message": "검색어를 입력해주세요.",
        }

    client = MFDSClient()

    try:
        items = await client.search_drug(keyword, num_of_rows=limit)
        results = [map_mfds_response_to_drug_reference(item) for item in items]

        if not results:
            return {
                "keyword": keyword,
                "source": "MFDS",
                "cache_used": False,
                "results": [],
                "message": "검색 결과가 없습니다. 약품명을 다시 확인해주세요.",
            }

        return {
            "keyword": keyword,
            "source": "MFDS",
            "cache_used": False,
            "results": results,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="실시간 약품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        )
