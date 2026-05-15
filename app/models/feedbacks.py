from tortoise import fields, models


class Feedback(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="feedbacks")
    guide = fields.ForeignKeyField("models.Guide", related_name="feedbacks", null=True)
    chat_message = fields.ForeignKeyField("models.ChatMessage", related_name="feedbacks", null=True)
    rating = fields.IntField(null=True)
    comment = fields.TextField(null=True)
    report_type = fields.CharField(max_length=50, null=True)
    is_safety_report = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "feedbacks"
