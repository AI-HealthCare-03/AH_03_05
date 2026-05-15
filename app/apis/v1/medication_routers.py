from fastapi import APIRouter

medication_router = APIRouter(prefix="/medications", tags=["Medications"])


@medication_router.patch("/{medication_id}/verify")
async def verify_medication(medication_id: int):
    """
    약품 후보 선택 (확정) API

    OCR 결과로 추출된 약품 후보를 사용자가 식약처 API 검색 결과로
    최종 확정할 때 호출된다.

    - medication_id: medications 테이블 PK
      (record_id는 medication_id로 서버에서 내부 조회)
    """
    return {
        "medication_id": medication_id,
        "is_verified": True,
        "api_status": "selected",
        "message": "약품 후보가 선택되었습니다.",
    }
