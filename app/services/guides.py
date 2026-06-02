from datetime import UTC, datetime

from tortoise.transactions import in_transaction

from app.models.guides import Guide, GuideItem, GuideItemType, GuideStatus
from app.models.medical_records import MedicalRecord
from app.models.medications import Medication
from app.models.user_health_profiles import UserHealthProfile
from app.models.users import User
from app.services.llm_service import generate_guide

DEFAULT_DISCLAIMER = (
    "본 안내는 의료 진단을 대체하지 않아요. 증상 변화나 이상 반응이 있으면 반드시 의료기관을 방문해주세요."
)

DATA_SOURCE_NOTICE_REALTIME = "LLM 호출에 성공하여 현재 시각 기준으로 생성된 정보예요."

# age_group 문자열을 정훈님 LLM 코드의 int 비교용 대표값으로 변환.
# (예: "60대" -> 65로 매핑해 노인 가이드라인이 적용되도록 함)
AGE_GROUP_TO_REPRESENTATIVE_AGE = {
    "10대": 15,
    "20대": 25,
    "30대": 35,
    "40대": 45,
    "50대": 55,
    "60대": 65,
    "70대": 75,
    "80대": 85,
    "90대 이상": 90,
}


class GuideService:
    """LLM 가이드 생성 서비스."""

    async def generate_for_record(
        self,
        user: User,
        record_id: int,
    ) -> dict | None:
        """
        지정 record + 사용자 건강 프로필 기반으로 LLM 가이드 생성.

        반환값:
            - dict: 응답 데이터 (guide_id, status, data_source, ... 모두 포함)
            - None: record가 없거나 다른 사용자 소유 (라우터에서 404)
        """
        # 1. record 소유자 검증
        record = await MedicalRecord.get_or_none(id=record_id, user=user, deleted_at=None)
        if record is None:
            return None

        # 2. health profile 로드 (없을 수 있음)
        profile = await UserHealthProfile.get_or_none(user=user)

        # 3. medications 로드 (해당 record에 연결된 것들)
        medications = await Medication.filter(record=record).all()

        # 4. LLM 입력 dict 구성
        health_profile_dict = self._build_health_profile_dict(profile, medications)

        # 5. Guide 레코드를 GENERATING 상태로 먼저 생성 (guide_id 확보)
        guide = await Guide.create(
            user=user,
            record_id=record_id,
            status=GuideStatus.GENERATING,
        )

        # 6. LLM 호출 (실패해도 Guide는 FAILED로 마무리)
        try:
            llm_result = generate_guide(health_profile_dict)
        except Exception as e:
            guide.status = GuideStatus.FAILED
            guide.disclaimer = DEFAULT_DISCLAIMER
            await guide.save()
            return {
                "guide_id": guide.id,
                "status": GuideStatus.FAILED.value,
                "data_source": {
                    "type": "REALTIME",
                    "timestamp": datetime.now(UTC),
                    "notice": f"LLM 가이드 생성에 실패했어요: {e}",
                },
                "medication_guide": "",
                "lifestyle_guide": "",
                "warning_message": None,
                "disclaimer": DEFAULT_DISCLAIMER,
                "guide_items": [],
            }

        # 7. 결과를 Guide + GuideItem에 저장
        async with in_transaction():
            guide.status = GuideStatus.COMPLETED
            guide.medication_guide = llm_result.get("medication_guide", "")
            guide.lifestyle_guide = llm_result.get("lifestyle_guide", "")
            guide.warning_message = llm_result.get("warning_message")
            guide.disclaimer = llm_result.get("disclaimer", DEFAULT_DISCLAIMER)
            guide.generated_at = datetime.now(UTC)
            await guide.save()

            for item in llm_result.get("guide_items", []):
                # item_type이 잘못된 경우 건너뜀
                raw_type = item.get("item_type", "")
                try:
                    item_type_enum = GuideItemType(raw_type)
                except ValueError:
                    continue
                await GuideItem.create(
                    guide=guide,
                    item_type=item_type_enum,
                    title=item.get("title", "")[:255],
                    content=item.get("content", ""),
                    sort_order=item.get("sort_order", 0),
                    guideline_source_id=item.get("guideline_source_id"),
                )

        # 8. 최종 응답
        saved_items = await GuideItem.filter(guide=guide).order_by("sort_order")
        return {
            "guide_id": guide.id,
            "status": GuideStatus.COMPLETED.value,
            "data_source": {
                "type": "REALTIME",
                "timestamp": guide.generated_at or datetime.now(UTC),
                "notice": DATA_SOURCE_NOTICE_REALTIME,
            },
            "medication_guide": guide.medication_guide or "",
            "lifestyle_guide": guide.lifestyle_guide or "",
            "warning_message": guide.warning_message,
            "disclaimer": guide.disclaimer or DEFAULT_DISCLAIMER,
            "guide_items": [
                {
                    "item_type": gi.item_type.value,
                    "title": gi.title,
                    "content": gi.content,
                    "sort_order": gi.sort_order,
                    "guideline_source_id": gi.guideline_source_id,
                }
                for gi in saved_items
            ],
        }

    def _build_health_profile_dict(
        self,
        profile: UserHealthProfile | None,
        medications: list[Medication],
    ) -> dict:
        """LLM 입력용 dict 구성 (정훈님 generate_guide 시그니처에 맞춤)."""
        chronic_diseases: list = []
        age = 0
        doctor_opinion = ""

        if profile is not None:
            chronic_diseases = profile.chronic_diseases or []
            doctor_opinion = profile.doctor_opinion or ""
            # age_group을 대표 정수로 변환 (LLM 코드가 int 비교를 함)
            age = AGE_GROUP_TO_REPRESENTATIVE_AGE.get(profile.age_group or "", 0)

        med_list = [
            {
                "drug_name": m.drug_name,
                "ingredient_name": m.ingredient_name,
                "dosage": m.dosage,
                "caution": m.caution,
                "side_effect": m.side_effect,
                "frequency": m.frequency,
                "timing": m.timing,
            }
            for m in medications
        ]

        return {
            "age": age,
            "chronic_diseases": chronic_diseases,
            "medications": med_list,
            "doctor_opinion": doctor_opinion,
        }

    async def get_latest_guide_by_record(self, user: User, record_id: int) -> dict | None:
        guide = await Guide.filter(record_id=record_id, user=user).order_by("-created_at").first()
        if guide is None:
            return None
        return await self.get_guide_by_id(user=user, guide_id=guide.id)

    async def get_guide_by_id(self, user: User, guide_id: int) -> dict | None:
        """
        guide_id로 단건 조회. 본인 가이드만 조회 가능.

        반환값:
            - dict: 응답용 데이터 (GenerateGuideResponse 형식과 동일)
            - None: 가이드 없음 또는 다른 사용자 소유 (404)
        """
        guide = await Guide.get_or_none(id=guide_id, user=user)
        if guide is None:
            return None

        items = await GuideItem.filter(guide=guide).order_by("sort_order")

        timestamp = guide.generated_at or guide.created_at or datetime.now(UTC)

        return {
            "guide_id": guide.id,
            "status": guide.status.value,
            "data_source": {
                "type": "REALTIME",
                "timestamp": timestamp,
                "notice": "저장된 가이드를 조회한 결과입니다.",
            },
            "medication_guide": guide.medication_guide or "",
            "lifestyle_guide": guide.lifestyle_guide or "",
            "warning_message": guide.warning_message,
            "disclaimer": guide.disclaimer or DEFAULT_DISCLAIMER,
            "guide_items": [
                {
                    "item_type": gi.item_type.value,
                    "title": gi.title,
                    "content": gi.content,
                    "sort_order": gi.sort_order,
                    "guideline_source_id": gi.guideline_source_id,
                }
                for gi in items
            ],
        }
