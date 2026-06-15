from pydantic import BaseModel


class OcrJobCreateRequest(BaseModel):
    record_id: int
    provider: str | None = None


class OcrJobResponse(BaseModel):
    job_id: int
    record_id: int
    job_type: str
    status: str


class ProcessingJobResponse(BaseModel):
    job_id: int
    job_type: str
    status: str
    record_id: int | None = None
    progress: int | None = None
    result_ref: str | None = None
