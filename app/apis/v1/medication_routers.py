from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.security import get_request_user
from app.dtos.medications import (
    MedicationVerifyRequest,
    MedicationVerifyResponse,
    MedicationAlarmUpdateRequest,  # 스프린트 3 DTO
    MedicationAlarmResponse,  # 스프린트 3 DTO
)
from app.exceptions.common import NotFoundException
from app.models.users import User
from app.models.medications import Medication  # 스프린트 3 ORM 모델
from app.services.medications import MedicationVerifyService

medication_router = APIRouter(prefix="/medications", tags=["Medications"])


@medication_router.patch("/{medication_id}/verify")
async def verify_medication(medication_id: int):
    """
    약품 후보 선택 (확정) API - 단건.

    OCR 결과로 추출된 약품 후보를 사용자가 식약처 API 검색 결과로
    최종 확정할 때 호출된다.
    """
    return {
        "medication_id": medication_id,
        "is_verified": True,
        "api_status": "selected",
        "message": "약품 후보가 선택되었습니다.",
    }


# ─── 스프린트 3: 맞춤형 복용 알림 관리 API 추가 ───

@medication_router.patch("/{medication_id}/alarm", response_model=MedicationAlarmResponse)
async def update_medication_alarm(
        medication_id: int,
        payload: MedicationAlarmUpdateRequest,
        user: Annotated[User, Depends(get_request_user)]  # 현재 요청한 유저 보안 검증
):
    """
    [스프린트 3] 특정 약품의 커스텀 알림 시간 배열 및 활성화 여부를 수정합니다.

    - medication_id: medications 테이블 PK
    - alarm_times: 수정할 알림 시간 배열 (ex: ["08:30", "20:00"])
    - is_alarm_enabled: 알림 On/Off 토글 상태
    """
    # 1. 수정할 약품이 존재하고, 본인의 처방 데이터가 맞는지 엄격하게 검증
    medication = await Medication.get_or_none(id=medication_id, user_id=user.id)
    if not medication:
        raise HTTPException(status_code=404, detail="해당 약품 정보를 찾을 수 없거나 권한이 없습니다.")

    # 2. 페이로드 바인딩 및 업데이트
    medication.alarm_times = payload.alarm_times
    medication.is_alarm_enabled = payload.is_alarm_enabled

    # 3. 데이터베이스 상태 반영
    await medication.save()
    return medication


@medication_router.get("/alarms", response_model=list[MedicationAlarmResponse])
async def get_medication_alarms(
        user: Annotated[User, Depends(get_request_user)]
):
    """
    [스프린트 3] 현재 로그인한 사용자가 등록한 모든 약품의 알림 설정 목록을 조회합니다.
    """
    # 현재 로그인한 사용자의 약품 테이블 데이터만 필터링하여 최신순 추출
    alarms = await Medication.filter(user_id=user.id).order_by("-created_at")
    return alarms


# ─── 일괄 확정용 별도 라우터 (URL: /records/{record_id}/medications/verify) ───
records_medications_router = APIRouter(prefix="/records/{record_id}/medications", tags=["Medications"])


@records_medications_router.post(
    "/verify",
    response_model=MedicationVerifyResponse,
    status_code=200,
)
async def verify_medications_batch(
        record_id: int,
        request: MedicationVerifyRequest,
        user: Annotated[User, Depends(get_request_user)],
        service: Annotated[MedicationVerifyService, Depends(MedicationVerifyService)],
) -> MedicationVerifyResponse:
    """
    약품 후보 일괄 확정 API.

    한 medical record에 속한 여러 medication을 한 번에 확정한다.
    OCR 완료 후 사용자가 약품들을 검토하고 식약처 검색 결과로 매칭한 뒤
    "검토 완료" 액션을 누를 때 호출된다.
    """
    result = await service.verify_medications_batch(user=user, record_id=record_id, items=request.verifications)
    if result is None:
        raise NotFoundException(detail="해당 record를 찾을 수 없습니다.")
    return MedicationVerifyResponse(**result)