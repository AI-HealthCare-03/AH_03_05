from tortoise import fields, models


class GuidelineChunk(models.Model):
    """
    가이드라인 텍스트 청크 및 임베딩 벡터 저장.
    RAG 검색 시 벡터 유사도 기반으로 관련 출처를 찾는다.
    """

    id = fields.BigIntField(primary_key=True)
    source = fields.ForeignKeyField(
        "models.GuidelineSource",
        related_name="chunks",
        on_delete=fields.CASCADE,
    )
    chunk_text = fields.TextField()
    chunk_index = fields.IntField(default=0)
    embedding = fields.JSONField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "guideline_chunks"
