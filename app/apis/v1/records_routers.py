from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.dependencies.security import get_request_user
from app.dtos.medical_records import MedicalRecordUploadResponse
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
