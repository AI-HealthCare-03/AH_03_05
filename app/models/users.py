from enum import StrEnum

from tortoise import fields, models


class UserStatus(StrEnum):
    ACTIVE = "active"
    WITHDRAWN = "withdrawn"


class User(models.Model):
    id = fields.BigIntField(primary_key=True)
    email = fields.CharField(max_length=255, unique=True)
    password_hash = fields.CharField(max_length=255)
    name = fields.CharField(max_length=50)
    nickname = fields.CharField(max_length=100, null=True)
    status = fields.CharEnumField(enum_type=UserStatus, default=UserStatus.ACTIVE)
    last_login_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    withdrawn_at = fields.DatetimeField(null=True)
    nickname_updated_at = fields.DatetimeField(null=True)
    password_changed_at = fields.DatetimeField(null=True)
    fcm_token = fields.CharField(max_length=255, null=True)

    class Meta:
        table = "users"
