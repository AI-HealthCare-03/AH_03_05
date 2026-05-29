from enum import StrEnum

from tortoise import fields, models


class ChatSessionStatus(StrEnum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class ChatSession(models.Model):
    """
    챗봇 상담 세션.
    사용자별 진료기록·가이드 단위로 챗봇 대화방을 가진다.
    """

    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="chat_sessions", on_delete=fields.CASCADE)
    record_id = fields.BigIntField(null=True)  # MedicalRecord FK (Backend A 모델 머지 후 ForeignKey 복구)
    guide = fields.ForeignKeyField("models.Guide", related_name="chat_sessions", null=True, on_delete=fields.SET_NULL)
    title = fields.CharField(max_length=255, null=True)
    status = fields.CharEnumField(
        enum_type=ChatSessionStatus,
        default=ChatSessionStatus.ACTIVE,
        max_length=20,
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    last_message_at = fields.DatetimeField(null=True)
    last_message_preview = fields.CharField(max_length=100, null=True)

    class Meta:
        table = "chat_sessions"
