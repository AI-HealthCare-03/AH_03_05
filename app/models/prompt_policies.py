from enum import StrEnum
from tortoise import fields, models


class PromptTargetType(StrEnum):
    GUIDE = "guide"
    CHAT = "chat"
    CHALLENGE = "challenge"


class PromptPolicy(models.Model):
    """
    프롬프트 정책 및 버전 관리.
    가이드/챗봇/챌린지별 현재 활성 프롬프트 버전을 관리한다.
    """

    id = fields.BigIntField(primary_key=True)
    target_type = fields.CharEnumField(
        enum_type=PromptTargetType,
        max_length=20,
    )
    prompt_version = fields.CharField(max_length=50)
    description = fields.TextField(null=True)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "prompt_policies"
