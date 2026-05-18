from tortoise import fields, models


class APIFailureLog(models.Model):
    """
    외부 API 호출 실패 로그.
    캐시 미스 + API 실패 시 폴백 전략 의사결정 및 모니터링용.

    사용 시점:
    - 식약처 API 호출 실패 시 (timeout, 5xx, connection error 등)
    - 외부 API 응답 검증 실패 시
    """

    id = fields.BigIntField(primary_key=True)

    # 어떤 API 호출이 실패했는지
    api_source = fields.CharField(max_length=100, index=True)
    endpoint = fields.CharField(max_length=500, null=True)
    request_params = fields.JSONField(null=True)

    # 실패 정보
    status_code = fields.IntField(null=True)
    error_type = fields.CharField(max_length=100, null=True)
    error_message = fields.TextField(null=True)

    # 시점
    occurred_at = fields.DatetimeField(auto_now_add=True, index=True)

    class Meta:
        table = "api_failure_logs"
