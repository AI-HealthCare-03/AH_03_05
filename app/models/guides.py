from enum import StrEnum

from tortoise import fields, models


class GuideStatus(StrEnum):
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Guide(models.Model):
    """
    진료기록 기반 복약·생활습관 LLM 가이드.
    medication_guide, lifestyle_guide, warning, disclaimer로 구성.
    """

    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField(
        "models.User", related_name="guides", on_delete=fields.CASCADE
    )
    record_id = fields.BigIntField(null=True)  # MedicalRecord FK (Backend A 모델 머지 후 복구)
    status = fields.CharEnumField(
        enum_type=GuideStatus,
        default=GuideStatus.GENERATING,
        max_length=20,
    )
    medication_guide = fields.TextField(null=True)
    lifestyle_guide = fields.TextField(null=True)
    warning_message = fields.TextField(null=True)
    disclaimer = fields.TextField(null=True)
    model_name = fields.CharField(max_length=100, null=True)
    prompt_version = fields.CharField(max_length=50, null=True)
    generated_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "guides"


class GuideItemType(StrEnum):
    MEDICATION = "MEDICATION"
    LIFESTYLE = "LIFESTYLE"
    WARNING = "WARNING"


class GuideItem(models.Model):
    """
    가이드 내 세부 항목 (약품별 / 생활습관별).
    guideline_source_id로 공식협회 RAG 출처 추적 (Sprint 2 파일럿).
    """

    id = fields.BigIntField(primary_key=True)
    guide = fields.ForeignKeyField(
        "models.Guide", related_name="items", on_delete=fields.CASCADE
    )
    item_type = fields.CharEnumField(enum_type=GuideItemType, max_length=50)
    title = fields.CharField(max_length=255)
    content = fields.TextField()
    sort_order = fields.IntField(default=0)
    guideline_source_id = fields.BigIntField(null=True)  # guideline_sources FK (RAG 파일럿용, 추후 추가)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "guide_items"