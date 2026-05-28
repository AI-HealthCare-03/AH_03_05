from enum import StrEnum

from tortoise import fields, models


class EmbeddingStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GuidelineSource(models.Model):
    """
    공식 가이드라인 출처 (RAG 파일럿 및 Sprint 3 pgvector 고도화용).
    """

    id = fields.BigIntField(primary_key=True)
    organization_name = fields.CharField(max_length=200)
    guideline_title = fields.CharField(max_length=500)
    source_url = fields.CharField(max_length=1000, null=True)
    disease_or_topic = fields.CharField(max_length=200, null=True)
    embedding_status = fields.CharEnumField(
        enum_type=EmbeddingStatus,
        default=EmbeddingStatus.PENDING,
        max_length=20,
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "guideline_sources"
