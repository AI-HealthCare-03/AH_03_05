from pydantic import BaseModel, ConfigDict, Field

# ─── [기존] 유정님 구현: 약품 후보 일괄 확정 DTO ───


class MedicationVerificationItem(BaseModel):
    medication_id: int = Field(..., description="medications 테이블 PK")
    drug_ref_id: str | None = Field(None, description="식약처 표준 코드 문자열 (선택 사항)")


# 서비스단과의 하위 호환성을 위한 별칭 지정
MedicationVerifyItem = MedicationVerificationItem


class MedicationVerifyRequest(BaseModel):
    verifications: list[MedicationVerifyItem] = Field(..., min_length=1, description="확정할 항목 목록")


class MedicationVerifyResponse(BaseModel):
    """
    [교정] 유정님 기존 테스트 코드(test_verify_apis.py)가 파싱하는 실제 서비스 리턴 규격과 일치시킵니다.
    """

    record_id: int = Field(..., description="진료기록 마스터 PK")
    record_status: str = Field(..., description="기록 상태")
    verified_count: int = Field(..., description="이번에 확정 처리된 약품 수")
    total_count: int = Field(..., description="해당 기록의 전체 약품 수")
    medications: list[dict] = Field(..., description="확정된 약품 상세 리스트")


# ─── [신규] 정호님 구현: 스프린트 3 맞춤형 복용 알림 DTO ───


class MedicationAlarmUpdateRequest(BaseModel):
    """
    사용자가 알림 시간이나 On/Off 스위치를 변경할 때 사용하는 요청 DTO
    """

    alarm_times: list[str] = Field(default=[], description="알림 시간 배열 (형식: ['08:00', '13:00'])")
    is_alarm_enabled: bool = Field(default=True, description="해당 약품의 알림 활성화 여부")


class MedicationAlarmResponse(BaseModel):
    """
    알림 설정 변경 후 프론트엔드에 깔끔하게 포맷팅해서 던져줄 응답 DTO
    """

    id: int
    drug_name: str
    alarm_times: list[str] | None
    is_alarm_enabled: bool

    model_config = ConfigDict(from_attributes=True)


# ─── [신규] 복용법 수정 DTO ───
class MedicationDosageUpdateRequest(BaseModel):
    dosage: str | None = Field(None, description="복용량 (예: 1정)")
    frequency: str | None = Field(None, description="복용 빈도 (예: 1일 3회)")
    timing: str | None = Field(None, description="복용 시점 (예: 식후 30분)")
    duration: str | None = Field(None, description="복용 기간 (예: 14일)")


class MedicationDosageUpdateResponse(BaseModel):
    medication_id: int
    dosage: str | None
    frequency: str | None
    timing: str | None
    duration: str | None

    model_config = ConfigDict(from_attributes=True)


# ─── [신규] 진료기록별 약품 목록 조회 DTO ───
class RecordMedicationItem(BaseModel):
    id: int = Field(serialization_alias="medication_id")
    drug_name: str
    ingredient_name: str | None = None
    manufacturer: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    timing: str | None = None
    duration: str | None = None
    caution: str | None = None
    side_effect: str | None = None
    is_verified: bool
    review_status: str
    api_status: str

    model_config = ConfigDict(from_attributes=True)
