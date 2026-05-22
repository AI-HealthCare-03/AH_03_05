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
    ALLOWED_RECORD_STATUSES = {RecordStatus.OCR_COMPLETED}

    def _get_default_alarm_times(self, frequency: str | None, timing: str | None) -> list[str]:
        """
        [스프린트 3] 정훈님의 알림 규칙 매핑 가이드에 따른 기본 알림 시간 파싱 유틸 함수.
        추후 정훈님의 파일(예: app/core/notification_defaults.py)이 병합되면 이 함수를 교체하거나 바인딩합니다.
        """
        # 기본 스케줄 예시 매핑 (주 1회, 필요시 복용 등 특이 케이스는 아침 기본 배치)
        if not frequency or "1" in frequency:
            return ["08:00"]
        elif "2" in frequency:
            return ["08:00", "19:00"]
        elif "3" in frequency or "세번" in (frequency or ""):
            return ["08:00", "13:00", "19:00"]
        elif "4" in frequency:
            return ["08:00", "13:00", "18:00", "22:00"]

        # 매칭되는 빈도가 없으면 안전하게 아침/저녁 식후 기본값 배치
        return ["09:00", "19:00"]

    async def verify_medications_batch(
        self,
        user: User,
        record_id: int,
        items: list[MedicationVerifyItem],
    ) -> dict | None:
        """
        한 record에 속한 여러 medication을 일괄 확정하고,
        동시에 스프린트 3 요구사항에 따른 초기 맞춤형 알림 시간을 자동으로 산출하여 저장합니다.
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

        # 5. 트랜잭션으로 medication 일괄 업데이트 + 알림 기본 시간 주입
        medication_map = {m.id: m for m in medications}
        async with in_transaction():
            for item in items:
                medication = medication_map[item.medication_id]
                medication.is_verified = True
                medication.api_status = ApiStatus.SELECTED
                medication.review_status = ReviewStatus.REVIEWED

                if item.drug_ref_id is not None:
                    medication.drug_ref_id = drug_ref_map[item.drug_ref_id]

                # ─── 스프린트 3 연동 구역 ───
                # OCR로 추출된 약품의 복용 빈도(frequency)와 복용 시점(timing)을 기반으로 기본 알림 배열 세팅
                if medication.alarm_times is None:
                    medication.alarm_times = self._get_default_alarm_times(
                        frequency=medication.frequency, timing=medication.timing
                    )
                    medication.is_alarm_enabled = True
                # ────────────────────────────

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
                    "alarm_times": m.alarm_times,  # 응답 규격 확장
                    "is_alarm_enabled": m.is_alarm_enabled,  # 응답 규격 확장
                }
                for m in medications
            ],
        }
