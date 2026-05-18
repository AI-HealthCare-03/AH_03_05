from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.dependencies.security import get_request_user
from app.dtos.medical_records import (
    MedicalRecordDetailResponse,
    MedicalRecordListItem,
    MedicalRecordListResponse,
    MedicalRecordUploadResponse,
)
from app.dtos.ocr import OcrResultResponse, OcrTextUpdateRequest, OcrTextUpdateResponse
from app.models.medical_records import RecordType
from app.models.users import User
from app.services.medical_records import MedicalRecordService

records_router = APIRouter(prefix="/records", tags=["records"])


@records_router.post("", response_model=MedicalRecordUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_medical_record(
    user: Annotated[User, Depends(get_request_user)],
    medical_record_service: Annotated[MedicalRecordService, Depends(MedicalRecordService)],
    record_type: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
) -> MedicalRecordUploadResponse:
    if record_type not in [rt.value for rt in RecordType]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"record_type은 {[rt.value for rt in RecordType]} 중 하나여야 합니다.",
        )
    record = await medical_record_service.upload_record(
        user=user,
        record_type=record_type,
        filename=file.filename,
        content_type=file.content_type,
        file_size_bytes=file.size,
    )
    return MedicalRecordUploadResponse.model_validate(record)


@records_router.get("", response_model=MedicalRecordListResponse, status_code=status.HTTP_200_OK)
async def get_medical_records(
    user: Annotated[User, Depends(get_request_user)],
    medical_record_service: Annotated[MedicalRecordService, Depends(MedicalRecordService)],
    page: int = 1,
    size: int = 10,
    record_type: str | None = None,
) -> MedicalRecordListResponse:
    records, total = await medical_record_service.get_records(user, page, size, record_type)
    return MedicalRecordListResponse(
        items=[MedicalRecordListItem.model_validate(r) for r in records],
        page=page,
        size=size,
    )


@records_router.get("/{record_id}", response_model=MedicalRecordDetailResponse, status_code=status.HTTP_200_OK)
async def get_medical_record(
    record_id: int,
    user: Annotated[User, Depends(get_request_user)],
    medical_record_service: Annotated[MedicalRecordService, Depends(MedicalRecordService)],
) -> MedicalRecordDetailResponse:
    record = await medical_record_service.get_record(user, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기록을 찾을 수 없습니다.")
    return MedicalRecordDetailResponse.model_validate(record)


@records_router.get("/{record_id}/ocr-result", response_model=OcrResultResponse, status_code=200)
async def get_ocr_result(
    record_id: int,
    user: Annotated[User, Depends(get_request_user)],
    medical_record_service: Annotated[MedicalRecordService, Depends(MedicalRecordService)],
) -> OcrResultResponse:
    result = await medical_record_service.get_ocr_result(user, record_id)
    if result is None:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    return OcrResultResponse(**result)


@records_router.patch("/{record_id}/ocr-text", response_model=OcrTextUpdateResponse, status_code=200)
async def update_ocr_text(
    record_id: int,
    request: OcrTextUpdateRequest,
    user: Annotated[User, Depends(get_request_user)],
    medical_record_service: Annotated[MedicalRecordService, Depends(MedicalRecordService)],
) -> OcrTextUpdateResponse:
    record = await medical_record_service.update_ocr_text(user, record_id, request.ocr_edited_text)
    if record is None:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    return OcrTextUpdateResponse(
        record_id=record.id,
        status=record.status,
        updated_at=record.updated_at,
    )
