from pydantic import BaseModel, Field


class MedicationVerifyItem(BaseModel):
    """확정할 medication 단일 항목."""

    medication_id: int = Field(description="medications 테이블 PK")
    drug_ref_id: str | None = Field(
        default=None,
        description="식약처 약품 코드(ITEM_SEQ). 사용자가 검색해서 선택한 약품.",
    )


class MedicationVerifyRequest(BaseModel):
    """약품 후보 일괄 확정 요청."""

    verifications: list[MedicationVerifyItem] = Field(
        min_length=1,
        description="확정할 medication 항목 목록. 최소 1개 이상.",
    )


class VerifiedMedicationResponse(BaseModel):
    """확정 처리된 medication 단일 응답."""

    medication_id: int
    drug_ref_id: str | None
    is_verified: bool
    review_status: str
    api_status: str


class MedicationVerifyResponse(BaseModel):
    """약품 후보 일괄 확정 응답."""

    record_id: int
    record_status: str
    verified_count: int = Field(description="이번 요청으로 확정된 medication 수")
    total_count: int = Field(description="해당 record의 전체 medication 수")
    medications: list[VerifiedMedicationResponse]
