from tortoise.transactions import in_transaction

from app.dtos.medications import MedicationVerifyItem
from app.exceptions.common import BadRequestException
from app.models.drug_references import DrugReference
from app.models.medical_records import MedicalRecord, RecordStatus
from app.models.medications import ApiStatus, Medication, ReviewStatus
from app.models.users import User


class MedicationVerifyService:
    """약품 후보 일괄 확정 서비스."""

    # verify 호출 가능한 record 상태
    # (현재 RecordStatus에 REVIEWED가 없어서 ocr_completed에서만 verify 허용.
    #  추후 RecordStatus.REVIEWED 추가되면 재호출 허용으로 확장 가능)
    ALLOWED_RECORD_STATUSES = {RecordStatus.OCR_COMPLETED}

    async def verify_medications_batch(
        self,
        user: User,
        record_id: int,
        items: list[MedicationVerifyItem],
    ) -> dict | None:
        """
        한 record에 속한 여러 medication을 일괄 확정한다.

        반환값:
            - dict: 정상 처리 시 라우터에서 응답 DTO로 변환할 결과
            - None: record 없음 또는 다른 사용자 소유 (라우터에서 404)

        예외:
            - BadRequestException: record 상태가 verify 불가, 잘못된 medication_id,
              존재하지 않는 drug_ref_id(식약처 코드) 등
        """
        # 1. record 조회 + 소유자 검증
        record = await MedicalRecord.get_or_none(id=record_id, user=user, deleted_at=None)
        if record is None:
            return None

        # 2. record 상태 검증 (ocr_completed만 허용)
        if record.status not in self.ALLOWED_RECORD_STATUSES:
            raise BadRequestException(detail=f"현재 상태({record.status})에서는 약품 확정을 할 수 없습니다.")

        # 3. 요청한 medication들이 모두 이 record 소속인지 검증
        requested_ids = [item.medication_id for item in items]
        medications = await Medication.filter(id__in=requested_ids, record=record).all()

        if len(medications) != len(requested_ids):
            found_ids = {m.id for m in medications}
            missing = [mid for mid in requested_ids if mid not in found_ids]
            raise BadRequestException(detail=f"해당 record에 속하지 않은 medication_id: {missing}")

        # 4. 요청한 drug_code들을 DrugReference로 미리 매핑 (있는 것만)
        drug_codes = [item.drug_ref_id for item in items if item.drug_ref_id is not None]
        drug_ref_map: dict[str, int] = {}
        if drug_codes:
            refs = await DrugReference.filter(drug_code__in=drug_codes).all()
            drug_ref_map = {ref.drug_code: ref.id for ref in refs}

            # 식약처 코드가 캐시에 없으면 BadRequest
            missing_codes = [c for c in drug_codes if c not in drug_ref_map]
            if missing_codes:
                raise BadRequestException(
                    detail=(
                        f"존재하지 않는 약품 코드: {missing_codes}. "
                        "약품 검색(/api/v1/drugs/search)을 먼저 호출해 캐시를 채워주세요."
                    )
                )

        # 5. 트랜잭션으로 medication 일괄 업데이트
        # (현재는 medication만 확정. record.status 전환은 RecordStatus.REVIEWED가
        #  추가되면 같이 처리할 예정.)
        medication_map = {m.id: m for m in medications}
        async with in_transaction():
            for item in items:
                medication = medication_map[item.medication_id]
                medication.is_verified = True
                medication.api_status = ApiStatus.SELECTED
                medication.review_status = ReviewStatus.REVIEWED
                if item.drug_ref_id is not None:
                    medication.drug_ref_id = drug_ref_map[item.drug_ref_id]
                await medication.save()

        # 6. 응답용 데이터 구성
        total_count = await Medication.filter(record=record).count()

        # 응답에는 사용자가 보낸 drug_code(문자열)를 그대로 노출
        item_drug_code_map = {item.medication_id: item.drug_ref_id for item in items}

        return {
            "record_id": record.id,
            "record_status": record.status.value,
            "verified_count": len(items),
            "total_count": total_count,
            "medications": [
                {
                    "medication_id": m.id,
                    "drug_ref_id": item_drug_code_map.get(m.id),
                    "is_verified": m.is_verified,
                    "review_status": m.review_status.value,
                    "api_status": m.api_status.value,
                }
                for m in medications
            ],
        }
