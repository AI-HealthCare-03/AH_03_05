from enum import StrEnum
from tortoise import fields, models


class ConsentType(StrEnum):
    TERMS = "terms"
    PRIVACY = "privacy"
    SENSITIVE_HEALTH = "sensitive_health"
    AI_ANALYSIS = "ai_analysis"
    MARKETING = "marketing"


class RequiredType(StrEnum):
    REQUIRED = "required"
    OPTIONAL = "optional"


class UserConsent(models.Model):
    id = fields.BigIntField(primary_key=True)
    user = fields.ForeignKeyField("models.User", related_name="consents")
    consent_type = fields.CharEnumField(enum_type=ConsentType)
    required_type = fields.CharEnumField(enum_type=RequiredType)
    is_agreed = fields.BooleanField()
    agreed_at = fields.DatetimeField(null=True)
    revoked_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "user_consents"
