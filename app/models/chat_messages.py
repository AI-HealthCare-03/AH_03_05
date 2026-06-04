from enum import StrEnum

from tortoise import fields, models


class SenderType(StrEnum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class MessageCategory(StrEnum):
    GENERAL = "general"
    SIDE_EFFECT = "side_effect"
    DOSAGE_TIMING = "dosage_timing"
    LIFESTYLE = "lifestyle"
    EMERGENCY = "emergency"


class ChatMessage(models.Model):
    """
    챗봇 세션 내 개별 메시지 (사용자 입력 / 챗봇 응답).
    safety_flag, safety_notice로 위험 질문 감지 결과 저장.
    category: 메시지 주제 분류 (general/side_effect/dosage_timing/lifestyle/emergency)
    """

    id = fields.BigIntField(primary_key=True)
    session = fields.ForeignKeyField("models.ChatSession", related_name="messages", on_delete=fields.CASCADE)
    user = fields.ForeignKeyField("models.User", related_name="chat_messages", on_delete=fields.CASCADE)
    sender_type = fields.CharEnumField(enum_type=SenderType, max_length=20)
    content = fields.TextField()
    safety_flag = fields.BooleanField(default=False)
    safety_notice = fields.TextField(null=True)
    category = fields.CharEnumField(
        enum_type=MessageCategory,
        max_length=20,
        default=MessageCategory.GENERAL,
        null=True,
    )
    model_name = fields.CharField(max_length=100, null=True)
    prompt_version = fields.CharField(max_length=50, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "chat_messages"
