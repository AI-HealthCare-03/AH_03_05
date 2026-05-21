from datetime import datetime

from pydantic import BaseModel, Field


class GenerateGuideRequest(BaseModel):
    """가이드 생성 요청. record_id로 medical_record와 health_profile을 조회한다."""

    record_id: int = Field(description="가이드를 생성할 medical_records PK")


class GuideItemResponse(BaseModel):
    item_type: str
    title: str
    content: str
    sort_order: int
    guideline_source_id: int | None = None


class DataSourceInfo(BaseModel):
    type: str = Field(description="REALTIME 또는 CACHE")
    timestamp: datetime
    notice: str


class GenerateGuideResponse(BaseModel):
    guide_id: int
    status: str
    data_source: DataSourceInfo
    medication_guide: str
    lifestyle_guide: str
    warning_message: str | None = None
    disclaimer: str
    guide_items: list[GuideItemResponse]
