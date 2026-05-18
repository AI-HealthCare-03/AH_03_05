from tortoise import fields, models


class UserHealthProfile(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.OneToOneField("models.User", related_name="health_profile")
    age_group = fields.CharField(max_length=20, null=True)
    gender = fields.CharField(max_length=10, null=True)
    chronic_diseases = fields.JSONField(null=True)
    allergies = fields.JSONField(null=True)
    current_medications = fields.JSONField(null=True)
    medical_history = fields.TextField(null=True)
    doctor_opinion = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "user_health_profiles"
