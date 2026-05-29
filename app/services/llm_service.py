import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from app.services.guideline_loader import get_disease_names, get_guideline_context

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"


def build_drug_context(medications: list) -> str:
    if not medications:
        return ""
    parts = []
    for med in medications:
        name = med.get("drug_name", "")
        ingredient = med.get("ingredient_name", "")
        efficacy = med.get("efficacy", "")
        dosage = med.get("dosage", "")
        caution = med.get("caution", "")
        side_effect = med.get("side_effect", "")
        frequency = med.get("frequency", "")
        timing = med.get("timing", "")

        part = f"약품명: {name}"
        if ingredient:
            part += f"\n성분: {ingredient}"
        if efficacy:
            part += f"\n효능효과: {efficacy[:200]}"
        if dosage:
            part += f"\n용법용량: {dosage[:200]}"
        if caution:
            part += f"\n주의사항: {caution[:300]}"
        if side_effect:
            part += f"\n부작용: {side_effect[:200]}"
        if frequency or timing:
            part += f"\n처방 복용법: {frequency} {timing}".strip()
        parts.append(part)
    return "\n\n".join(parts)


def build_medication_system_prompt(drug_context: str, guideline_context: str) -> str:
    prompt = """당신은 MediPT의 복약 안내 AI입니다.
환자가 복용 중인 약물에 대해 정확하고 따뜻한 복약 안내를 생성합니다.

[톤 가이드]
- 따뜻하고 친근한 말투를 사용해요 (예: "~해보세요", "~하시면 좋아요")
- 어렵고 딱딱한 의학 용어는 쉬운 말로 풀어서 설명해요
- 각 항목은 2~3문장으로 간결하게 작성해요

[역할 및 제한사항]
- 제공된 약품 정보와 가이드라인에만 근거하여 답변해요
- 진단, 처방, 치료 결정은 절대 하지 않아요
- 응답은 반드시 JSON 형식으로만 출력해요

[가이드 생성 규칙]
- MEDICATION 항목 필수 포함 요소
  1) 약품이 어떤 역할을 하는지 (효능을 쉬운 말로)
  2) 처방된 복용법 (시간, 횟수)
  3) 복용 시 일반 주의 사항

- WARNING 항목은 아래 경우에만 생성해요
  단순 복용 팁은 MEDICATION에 포함해요
  1) 복용 금기 대상 (임신, 수유, 특정 질환 보유자)
  2) 타 약물 또는 검사와의 상호작용
     조영제 검사 전 복용 중단이 필요한 경우 반드시 WARNING으로 생성해요
  3) 저혈당 등 즉각 대응이 필요한 응급 증상
  4) 신기능/간기능 저하 환자 주의

[응답 형식]
{
  "_logic": {
    "diseases": ["질환명 리스트"],
    "drugs": ["약품명(효능) 리스트"],
    "warning_factors": ["해당하는 WARNING 요인만"],
    "decision": "MEDICATION×N | WARNING×N"
  },
  "medication_guide": "복약 안내 전체 요약 평문 (2~4문장)",
  "warning_message": null 또는 "주요 주의사항 요약",
  "guide_items": [
    {
      "item_type": "MEDICATION 또는 WARNING",
      "title": "약품명 또는 주의사항 제목",
      "content": "안내 내용 (2~3문장)",
      "sort_order": 1,
      "guideline_source_id": null
    }
  ]
}"""

    if drug_context:
        prompt += f"\n\n[약품 정보]\n{drug_context}"
    if guideline_context:
        prompt += f"\n\n[복약 관련 가이드라인]\n{guideline_context}"
    return prompt


def build_medication_user_prompt(health_profile: dict) -> str:
    medications = health_profile.get("medications", [])
    age = health_profile.get("age", 0)
    diseases = health_profile.get("chronic_diseases", [])
    disease_names = get_disease_names(diseases)

    med_list = (
        "\n".join([f"- {m.get('drug_name', '')} ({m.get('frequency', '')} {m.get('timing', '')})" for m in medications])
        if medications
        else "없음"
    )

    return f"""다음 환자의 복약 안내를 생성해주세요.

[환자 정보]
나이: {age}세
만성질환: {", ".join(disease_names) if disease_names else "없음"}

[현재 복용 약물]
{med_list}

_logic에서 warning_factors를 먼저 정리한 뒤
각 약품마다 MEDICATION 항목 1개씩 생성해주세요.

약품 주의사항에 아래 키워드가 포함된 경우
반드시 WARNING 항목으로 생성해주세요.
- 임신 / 수유 / 임부
- 신기능 / 간기능 저하
- 저혈당

JSON 형식으로 생성해주세요."""


def build_lifestyle_system_prompt(guideline_context: str) -> str:
    prompt = """당신은 MediPT의 생활습관 가이드 AI입니다.
환자의 만성질환과 의사 소견을 바탕으로 생활습관 개선 가이드를 생성합니다.

[톤 가이드]
- 따뜻하고 친근한 말투를 사용해요 (예: "~해보세요", "~하시면 좋아요")
- 어렵고 딱딱한 의학 용어는 쉬운 말로 풀어서 설명해요
- 환자의 상황에 공감하는 표현을 포함해요
- 각 항목은 2~3문장으로 간결하게 작성해요

[역할 및 제한사항]
- 제공된 공식 가이드라인에만 근거하여 답변해요
- 진단, 처방, 치료 결정은 절대 하지 않아요
- 응답은 반드시 JSON 형식으로만 출력해요

[역할 분리 기준]
복약 파트에서 이미 다룬 내용과 중복을 피해주세요.
생활습관 파트는 아래에 집중해요.

포함할 것
- 식단 구성 (저염식 방법, 권장/금지 식품, 구체적 수치)
- 운동 방법 (종류, 강도, 빈도, 시간)
- 자가 모니터링 (혈압/혈당 측정 시간, 기록 방법)
- 생활환경 개선 (절주 기준, 금연, 체중관리 목표)
- 정기검진 권고 (검사 종류, 주기)

피할 것
- 약 복용 시간, 용량, 방법 관련 내용
- 복약 가이드에서 이미 언급한 표현 반복

[응답 형식]
{
  "_logic": {
    "doctor_opinion_items": ["의사 소견에서 추출한 항목"],
    "guideline_items": ["가이드라인에서 추가할 항목"],
    "excluded": ["복약 파트와 중복으로 제외한 내용"],
    "decision": "LIFESTYLE×N"
  },
  "lifestyle_guide": "생활습관 가이드 전체 요약 평문 (2~4문장)",
  "guide_items": [
    {
      "item_type": "LIFESTYLE",
      "title": "항목 제목",
      "content": "안내 내용 (2~3문장)",
      "sort_order": 1,
      "guideline_source_id": null
    }
  ]
}"""

    if guideline_context:
        prompt += f"\n\n[참고 가이드라인]\n{guideline_context}"
    return prompt


def build_lifestyle_user_prompt(health_profile: dict, medication_result: dict) -> str:
    diseases = health_profile.get("chronic_diseases", [])
    age = health_profile.get("age", 0)
    doctor_opinion = health_profile.get("doctor_opinion", "")
    disease_names = get_disease_names(diseases)

    med_full_context = json.dumps(medication_result, ensure_ascii=False, indent=2)

    return f"""다음 환자의 생활습관 가이드를 생성해주세요.

[환자 정보]
나이: {age}세
만성질환: {", ".join(disease_names) if disease_names else "없음"}

[의사 소견]
{doctor_opinion if doctor_opinion else "없음"}

[이미 생성된 복약 가이드 전체 - 아래 내용과 중복되는 표현은 생략해주세요]
{med_full_context}

_logic에서 의사 소견 항목과 가이드라인 추가 항목을 먼저 정리하고
복약 파트와 중복되는 내용은 excluded에 기록한 뒤 제외해주세요.

아래 항목은 가이드라인 핵심 항목으로 반드시 LIFESTYLE에 포함해주세요.
- 절주
- 금연

총 3개 이상의 LIFESTYLE 항목을 JSON 형식으로 생성해주세요."""


def generate_guide(health_profile: dict) -> dict:
    chronic_diseases = health_profile.get("chronic_diseases", [])
    age = health_profile.get("age", 0)
    medications = health_profile.get("medications", [])

    guideline_context = get_guideline_context(chronic_diseases, age)
    drug_context = build_drug_context(medications)

    # ── 1호출: 복약 가이드 생성 ──
    try:
        med_response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": build_medication_system_prompt(drug_context, guideline_context),
                },
                {
                    "role": "user",
                    "content": build_medication_user_prompt(health_profile),
                },
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
            timeout=30.0,
        )
        medication_result = json.loads(med_response.choices[0].message.content)
        medication_result.pop("_logic", None)
    except Exception as e:
        medication_result = {
            "medication_guide": "",
            "warning_message": None,
            "guide_items": [],
            "error": str(e),
        }

    # ── 2호출: 생활습관 가이드 생성 ──
    try:
        lifestyle_response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": build_lifestyle_system_prompt(guideline_context),
                },
                {
                    "role": "user",
                    "content": build_lifestyle_user_prompt(health_profile, medication_result),
                },
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
            timeout=30.0,
        )
        lifestyle_result = json.loads(lifestyle_response.choices[0].message.content)
        lifestyle_result.pop("_logic", None)
    except Exception as e:
        lifestyle_result = {
            "lifestyle_guide": "",
            "guide_items": [],
            "error": str(e),
        }

    # ── 결과 합치기 ──
    med_items = [i for i in medication_result.get("guide_items", []) if i.get("item_type") in ("MEDICATION", "WARNING")]
    lifestyle_items = [i for i in lifestyle_result.get("guide_items", []) if i.get("item_type") == "LIFESTYLE"]
    all_items = []
    for idx, item in enumerate(med_items + lifestyle_items, 1):
        item["sort_order"] = idx
        all_items.append(item)

    return {
        "medication_guide": medication_result.get("medication_guide", ""),
        "lifestyle_guide": lifestyle_result.get("lifestyle_guide", ""),
        "warning_message": medication_result.get("warning_message"),
        "disclaimer": (
            "본 안내는 임상진료지침 정보센터 가이드라인 및 사용자님의 건강 프로필을 참고하여 생성되었어요. "
            "개인별 상태에 따라 다를 수 있으니 담당 의사와 꼭 상담해 주세요."
        ),
        "safety_flag": False,
        "guide_items": all_items,
        "generation_status": {
            "medication": "completed" if "error" not in medication_result else "failed",
            "lifestyle": "completed" if "error" not in lifestyle_result else "failed",
        },
    }
