from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile, status

from app.dependencies.security import get_request_user
from app.dtos.processing_jobs import OcrJobResponse, ProcessingJobResponse
from app.exceptions.common import NotFoundException
from app.models.users import User
from app.services.processing_jobs import ProcessingJobService
from app.services.vision_ocr_service import process_ocr_job

ocr_router = APIRouter(prefix="/ocr", tags=["ocr"])
jobs_router = APIRouter(prefix="/processing-jobs", tags=["processing-jobs"])


@ocr_router.post("/jobs", response_model=OcrJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_ocr_job(
    background_tasks: BackgroundTasks,
    user: Annotated[User, Depends(get_request_user)],
    processing_job_service: Annotated[ProcessingJobService, Depends(ProcessingJobService)],
    record_id: Annotated[int, Form()],
    file: Annotated[UploadFile, File()],
    provider: Annotated[str | None, Form()] = None,
) -> OcrJobResponse:
    job = await processing_job_service.create_ocr_job(
        user=user,
        record_id=record_id,
        provider=provider,
    )
    if job is None:
        raise NotFoundException(detail="기록을 찾을 수 없습니다.")

    image_data = await file.read()
    background_tasks.add_task(process_ocr_job, job, image_data)

    return OcrJobResponse(
        job_id=job.id,
        record_id=record_id,
        job_type=job.job_type,
        status=job.status,
    )


@jobs_router.get("/{job_id}", response_model=ProcessingJobResponse, status_code=status.HTTP_200_OK)
async def get_processing_job(
    job_id: int,
    user: Annotated[User, Depends(get_request_user)],
    processing_job_service: Annotated[ProcessingJobService, Depends(ProcessingJobService)],
) -> ProcessingJobResponse:
    job = await processing_job_service.get_job(user=user, job_id=job_id)
    if job is None:
        raise NotFoundException(detail="작업을 찾을 수 없습니다.")

    record_id = job.record_id if hasattr(job, "record_id") else None
    return ProcessingJobResponse(
        job_id=job.id,
        job_type=job.job_type,
        status=job.status,
        record_id=record_id,
    )
