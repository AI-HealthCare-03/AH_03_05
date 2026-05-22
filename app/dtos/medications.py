from pydantic import BaseModel, Field


# ─── [기존] 유정님 구현: 약품 후보 일괄 확정 DTO ───

class MedicationVerificationItem(BaseModel):
    medication_id: int = Field(..., description="medications 테이블 PK")
    drug_ref_id: str | None = Field(None, description="식약처 표준 코드 문자열 (선택 사항)")


# 💡 서비스단(services/medications.py)에서 'MedicationVerifyItem'이라는 이름으로 참조하고 있으므로 별칭(Alias) 지정
MedicationVerifyItem = MedicationVerificationItem


class MedicationVerifyRequest(BaseModel):
    verifications: list[MedicationVerifyItem] = Field(..., min_items=1, description="확정할 항목 목록")


class MedicationVerifyResponse(BaseModel):
    status: str = Field(..., description="처리 결과 상태 (예: 'reviewed')")
    updated_count: int = Field(..., description="업데이트된 약품 수")



# ─── [신규] 정호님 구현: 스프린트 3 맞춤형 복용 알림 DTO ───

class MedicationAlarmUpdateRequest(BaseModel):
    """
    사용자가 알림 시간이나 On/Off 스위치를 변경할 때 사용하는 요청 DTO
    """
    alarm_times: list[str] = Field(
        default=[],
        description="알림 시간 배열 (형식: ['08:00', '13:00'])"
    )
    is_alarm_enabled: bool = Field(
        default=True,
        description="해당 약품의 알림 활성화 여부"
    )


class MedicationAlarmResponse(BaseModel):
    """
    알림 설정 변경 후 프론트엔드에 깔끔하게 포맷팅해서 던져줄 응답 DTO
    """
    id: int
    drug_name: str
    alarm_times: list[str] | None
    is_alarm_enabled: bool

    class Config:
        # Tortoise ORM 객체를 Pydantic이 자동으로 파싱할 수 있도록 설정
        from_attributes = True