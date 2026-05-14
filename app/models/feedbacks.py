from tortoise import fields, models


class Feedback(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="feedbacks")
    guide_id = fields.BigIntField(null=True)  # Guide 모델 연결 전 임시
    chat_message_id = fields.BigIntField(null=True)  # ChatMessage 모델 연결 전 임시
    rating = fields.IntField(null=True)
    comment = fields.TextField(null=True)
    report_type = fields.CharField(max_length=50, null=True)
    is_safety_report = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "feedbacks"
