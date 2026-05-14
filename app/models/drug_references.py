from tortoise import fields, models


class DrugReference(models.Model):
    """
    식약처 의약품 정보 캐시 마스터 테이블.
    공공데이터포털 - 식품의약품안전처 의약품 제품 허가 정보 기반.
    https://www.data.go.kr/data/15095677/openapi.do
    """

    id = fields.BigIntField(primary_key=True)
    drug_code = fields.CharField(max_length=100, unique=True, null=True)
    drug_name = fields.CharField(max_length=255)
    ingredient_name = fields.CharField(max_length=255, null=True)
    manufacturer = fields.CharField(max_length=255, null=True)
    efficacy = fields.TextField(null=True)
    usage_method = fields.TextField(null=True)
    caution = fields.TextField(null=True)
    side_effect = fields.TextField(null=True)
    source = fields.CharField(max_length=100, default="mfds")
    source_url = fields.CharField(max_length=500, null=True)
    raw_response = fields.TextField(null=True)
    fetched_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "drug_references"