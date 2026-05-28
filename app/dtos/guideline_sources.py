from datetime import datetime

from pydantic import BaseModel


class GuidelineSourceCreateRequest(BaseModel):
    organization_name: str
    guideline_title: str
    source_url: str | None = None
    disease_or_topic: str | None = None


class GuidelineSourceResponse(BaseModel):
    guideline_source_id: int
    organization_name: str
    guideline_title: str
    source_url: str | None
    disease_or_topic: str | None
    embedding_status: str
    created_at: datetime

    class Config:
        from_attributes = True
