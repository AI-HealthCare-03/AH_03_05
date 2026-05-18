from datetime import datetime

from pydantic import BaseModel


class MedicationCandidate(BaseModel):
    drug_name: str
    confidence: float | None = None
    is_verified: bool = False
    dosage: str | None = None
    frequency: str | None = None
    timing: str | None = None
    caution: str | None = None
    drug_ref_id: int | None = None


class OcrResultResponse(BaseModel):
    record_id: int
    ocr_text: str | None = None
    ocr_edited_text: str | None = None
    ocr_confidence: float | None = None
    medication_candidates: list[MedicationCandidate] = []


class OcrTextUpdateRequest(BaseModel):
    ocr_edited_text: str


class OcrTextUpdateResponse(BaseModel):
    record_id: int
    status: str
    updated_at: datetime
