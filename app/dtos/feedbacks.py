from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class FeedbackCreateRequest(BaseModel):
    guide_id: int | None = Field(None, description="피드백 대상 가이드 PK")
    chat_message_id: int | None = Field(None, description="피드백 대상 챗봇 메시지 PK")
    rating: int | None = Field(None, ge=1, le=5, description="별점 (1~5)")
    comment: str | None = Field(None, max_length=2000, description="자유 코멘트")
    report_type: str | None = Field(None, max_length=50, description="신고 유형 (예: inaccurate, harmful)")
    is_safety_report: bool = Field(False, description="안전 관련 신고 여부")

    @model_validator(mode="after")
    def validate_target(self) -> "FeedbackCreateRequest":
        if self.guide_id is None and self.chat_message_id is None:
            raise ValueError("guide_id 또는 chat_message_id 중 하나는 반드시 필요합니다.")
        return self


class FeedbackResponse(BaseModel):
    id: int
    guide_id: int | None
    chat_message_id: int | None
    rating: int | None
    comment: str | None
    report_type: str | None
    is_safety_report: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LowRatedItem(BaseModel):
    feedback_id: int
    guide_id: int | None
    chat_message_id: int | None
    rating: int | None
    comment: str | None


class FeedbackSummaryResponse(BaseModel):
    total_count: int = Field(description="총 피드백 수")
    rating_distribution: dict[str, int] = Field(description="별점별 건수 (1~5)")
    average_rating: float | None = Field(description="평균 별점")
    report_count: int = Field(description="신고 건수")
    safety_report_count: int = Field(description="안전 신고 건수")
    low_rated_items: list[LowRatedItem] = Field(description="개선 필요 대상 (1~2점)")
