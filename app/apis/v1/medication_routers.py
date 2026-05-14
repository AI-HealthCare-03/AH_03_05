from fastapi import APIRouter

medication_router = APIRouter(prefix="/records", tags=["Medications"])


@medication_router.post("/{record_id}/medications/{medication_id}/verify")
async def verify_medication(record_id: int, medication_id: int):
    """
    약품 후보 선택 (확정) API

    사용자가 OCR 결과로 추출된 약품 후보 중에서 식약처 API 검색 결과를
    바탕으로 최종 약품을 선택할 때 호출됩니다.

    - record_id: 진료기록 ID
    - medication_id: 선택할 약품 ID (medications 테이블)
    """
    return {
        "record_id": record_id,
        "medication_id": medication_id,
        "is_verified": True,
        "api_status": "selected",
        "message": "약품 후보가 선택되었습니다.",
    }