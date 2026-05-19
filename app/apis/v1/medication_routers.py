from fastapi import APIRouter

from app.dtos.medications import (
    MedicationVerifyRequest,
    MedicationVerifyResponse,
    VerifiedMedicationResponse,
)

medication_router = APIRouter(prefix="/medications", tags=["Medications"])


@medication_router.patch("/{medication_id}/verify")
async def verify_medication(medication_id: int):
    """
    약품 후보 선택 (확정) API - 단건.

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


# 일괄 확정용 별도 라우터 (URL: /records/{record_id}/medications/verify)
records_medications_router = APIRouter(prefix="/records/{record_id}/medications", tags=["Medications"])


@records_medications_router.post(
    "/verify",
    response_model=MedicationVerifyResponse,
    status_code=200,
)
async def verify_medications_batch(
    record_id: int,
    request: MedicationVerifyRequest,
) -> MedicationVerifyResponse:
    """
    약품 후보 일괄 확정 API.

    한 medical record에 속한 여러 medication을 한 번에 확정한다.
    OCR 완료 후 사용자가 약품들을 검토하고 식약처 검색 결과로 매칭한 뒤
    "검토 완료" 액션을 누를 때 호출된다.

    - record_id: medical_records 테이블 PK (path)
    - verifications: 확정할 항목 목록 (body, 최소 1개)

    처리 내용:
    - 각 medication의 is_verified=True, api_status=SELECTED,
      review_status=REVIEWED로 전환
    - drug_ref_id 매칭 (선택 사항)
    - 1개 이상 확정되면 record.status = REVIEWED로 전환

    TODO (다음 작업):
    - 인증 의존성 추가 (get_request_user)
    - record 소유자 검증 (403)
    - record 상태 검증 (ocr_completed 또는 reviewed만 허용, 그 외 400)
    - 각 medication의 record 소속 검증
    - 트랜잭션 처리
    - 실제 DB 업데이트 로직 (services/medications.py 신설)
    """
    # 골격: 일단 mock 응답
    return MedicationVerifyResponse(
        record_id=record_id,
        record_status="reviewed",
        verified_count=len(request.verifications),
        total_count=len(request.verifications),
        medications=[
            VerifiedMedicationResponse(
                medication_id=v.medication_id,
                drug_ref_id=v.drug_ref_id,
                is_verified=True,
                review_status="reviewed",
                api_status="selected",
            )
            for v in request.verifications
        ],
    )
