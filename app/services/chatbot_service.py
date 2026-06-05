import json
import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

from app.services.guideline_loader import get_disease_names, get_guideline_context
from app.services.safety_filter import check_safety, get_safety_response

load_dotenv()

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"
# 동일 입력 결과 편차 최소화를 위한 고정 seed (재현성 확보)
LLM_SEED = 42


def build_chatbot_system_prompt(guideline_context: str) -> str:
    prompt = """당신은 MediPT의 복약 생활 도우미예요.
의사에게 물어보기엔 너무 소소하지만
혼자 해결하기엔 애매한 복약·생활습관 일상 질문에
친근하게 답변해드리는 역할이에요.

[역할 정의]
거창한 의학 상담이 아니라
일상에서 약 먹으면서 생기는 작은 궁금증,
생활습관 실천하면서 생기는 소소한 고민들을
가이드라인 기반으로 편하게 안내해드려요.

잘 답변할 수 있는 질문 예시
- "고혈압 있는데 오늘 삼겹살 먹어도 돼요?"
- "당뇨 있는데 술 얼마까지 마셔도 괜찮아요?"
- "혈압약 먹고 커피 마셔도 돼요?"
- "약 먹는 걸 깜빡했는데 지금 먹어도 될까요?"
- "운동 전에 혈당 체크 꼭 해야 하나요?"
- "저염식 하면서 외식할 때 뭐 먹는 게 좋아요?"

[톤 가이드]
- 친구한테 얘기하듯 따뜻하고 편안한 말투를 사용해요
- 어렵고 딱딱한 의학 용어는 쉬운 말로 풀어서 설명해요
- 2~4문장으로 간결하게 답변해요
- 너무 무겁거나 경직된 표현은 피해요

[답변 작성 기준]
- 가이드라인에 근거한 내용은 "~해요", "~하시면 좋아요" 로 답변해요
- 가이드라인 외 AI 학습 기반 내용은 "~라고 알려져 있어요" 로 답변해요
- 두 경우 모두 답변 마지막에 담당 의사 상담 권유를 포함해요
- 환자의 처방 정보(약품명, 복용법, 복용 시간)를 답변에 반드시 포함해요
- 가이드라인과 학습 내용 모두에 없는 경우만 "담당 의사와 상담해 주세요" 로만 안내해요

[답변하지 않는 것]
- 약 용량 변경, 복용 중단 여부 결정
- 처방 외 약물 추천
- 증상 악화 판단
- 가이드라인에 없는 약물 병용 판단
→ 위 경우는 "담당 의사와 상담해 보세요"로 안내해요

[safety_flag 판단 기준]
아래 상황이 감지되면 safety_flag를 true로 설정하고
answer 대신 안전 안내 문구를 반환해요.
- 고통/아픔과 함께 삶을 끝내고 싶다는 뉘앙스
- 약물 과량복용 암시
- 자해/자살 관련 맥락

[응답 형식]
{
  "answer": "답변 본문 (2~4문장)",
  "safety_flag": false,
  "disclaimer": "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요. 개인 상태에 따라 다를 수 있으니 담당 의사와 상담해 주세요.",
  "related_items": []
}"""

    if guideline_context:
        prompt += f"\n\n[참고 가이드라인]\n{guideline_context}"
    return prompt


def build_chatbot_user_prompt(
    user_input: str,
    health_profile: dict,
    conversation_history: list,
) -> str:
    diseases = health_profile.get("chronic_diseases", [])
    age_group = health_profile.get("age_group", "")
    medications = health_profile.get("current_medications") or health_profile.get("medications") or []
    disease_names = get_disease_names(diseases)

    med_list = (
        "\n".join([f"- {m.get('drug_name', '')} ({m.get('frequency', '')} {m.get('timing', '')})" for m in medications])
        if medications
        else "없음"
    )

    history_text = ""
    if conversation_history:
        history_text = "\n[이전 대화]\n"
        for turn in conversation_history[-5:]:
            role = "사용자" if turn.get("role") == "user" else "챗봇"
            history_text += f"{role}: {turn.get('content', '')}\n"

    return f"""[환자 정보]
나이: {age_group}
만성질환: {", ".join(disease_names) if disease_names else "없음"}
복용 약물: {med_list}
{history_text}
[현재 질문]
{user_input}

위 환자 정보와 가이드라인을 참고하여 답변해주세요.
safety_flag 판단 기준에 해당하면 반드시 safety_flag를 true로 설정해주세요.
JSON 형식으로 반환해주세요."""


async def chat(
    user_input: str,
    health_profile: dict,
    conversation_history: list | None = None,
) -> dict:
    """
    챗봇 응답 메인 함수

    1차: safety_filter 키워드 체크
    2차: LLM 맥락 판단
    """
    if conversation_history is None:
        conversation_history = []

    # 1차: 키워드 필터
    if check_safety(user_input):
        return get_safety_response()

    # 로어북 로드
    chronic_diseases = health_profile.get("chronic_diseases", [])
    age_group = health_profile.get("age_group", "")
    guideline_context = get_guideline_context(chronic_diseases, age_group)

    # LLM 호출
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": build_chatbot_system_prompt(guideline_context),
                },
                {
                    "role": "user",
                    "content": build_chatbot_user_prompt(user_input, health_profile, conversation_history),
                },
            ],
            temperature=0.5,
            seed=LLM_SEED,
            response_format={"type": "json_object"},
            timeout=30.0,
        )

        result = json.loads(response.choices[0].message.content)

        # 2차: LLM safety_flag 체크
        if result.get("safety_flag"):
            return get_safety_response()

        result.setdefault("answer", "")
        result.setdefault("safety_flag", False)
        result.setdefault(
            "disclaimer",
            "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요. "
            "개인 상태에 따라 다를 수 있으니 담당 의사와 상담해 주세요.",
        )
        result.setdefault("related_items", [])

        return result

    except Exception as e:
        return {
            "answer": "죄송해요, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
            "safety_flag": False,
            "disclaimer": "본 답변은 임상진료지침 정보센터 가이드라인을 참고했어요.",
            "related_items": [],
            "error": str(e),
        }
