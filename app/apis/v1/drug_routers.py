import json as json_module

import httpx
from fastapi import APIRouter, HTTPException

from app.services.mfds_client import MFDSClient, map_mfds_response_to_drug_reference

drug_router = APIRouter(prefix="/drugs", tags=["Drugs"])


@drug_router.get("/search")
async def search_drugs(keyword: str, limit: int = 10):
    """
    식약처 의약품안전나라 API로 약품 검색.

    - 검색어 빈 문자열 → 안내 메시지
    - 검색 결과 0건 → 안내 메시지
    - 외부 API 실패 → 상황별 HTTP 에러
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
        # 환경 변수 누락 등 (시작 시점 검증 추가 후엔 거의 안 들어옴)
        raise HTTPException(status_code=500, detail=str(e)) from e

    except httpx.TimeoutException as e:
        raise HTTPException(
            status_code=504,
            detail="식약처 API 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        ) from e

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
            ) from e
        raise HTTPException(
            status_code=503,
            detail="실시간 약품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        ) from e

    except (json_module.JSONDecodeError, KeyError) as e:
        raise HTTPException(
            status_code=502,
            detail="외부 API 응답 형식이 올바르지 않습니다.",
        ) from e

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail="실시간 약품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        ) from e


@drug_router.get("/{drug_id}")
async def get_drug_detail(drug_id: str):
    """
    식약처 의약품안전나라 API로 약품 상세 조회.

    - drug_id: 식약처 약품 식별 코드 (ITEM_SEQ)
    - 약품 없음 → 404
    - 외부 API 실패 → 상황별 HTTP 에러
    """
    if not drug_id.strip():
        raise HTTPException(
            status_code=400,
            detail="약품 코드를 입력해주세요.",
        )

    client = MFDSClient()
    try:
        item = await client.get_drug_detail(drug_id)

        if not item:
            raise HTTPException(
                status_code=404,
                detail="해당 약품 정보를 찾을 수 없습니다.",
            )

        data = map_mfds_response_to_drug_reference(item)

        return {
            "drug_code": drug_id,
            "source": "MFDS",
            "cache_used": False,
            "data": data,
        }

    except HTTPException:
        # 404, 400 그대로 재발생 (아래 except에 걸리지 않게)
        raise

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    except httpx.TimeoutException as e:
        raise HTTPException(
            status_code=504,
            detail="식약처 API 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        ) from e

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
            ) from e
        raise HTTPException(
            status_code=503,
            detail="실시간 약품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        ) from e

    except (json_module.JSONDecodeError, KeyError) as e:
        raise HTTPException(
            status_code=502,
            detail="외부 API 응답 형식이 올바르지 않습니다.",
        ) from e

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail="실시간 약품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        ) from e
