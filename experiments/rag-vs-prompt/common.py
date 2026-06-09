"""실험 공통 모듈: 챗봇 응답 생성 + 토큰 측정 (프로덕션 함수 재사용)."""

import json
import os
import sys

# 프로젝트 루트를 path에 추가해 app.* import 가능하게
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from dotenv import load_dotenv
from openai import AsyncOpenAI

from app.services.chatbot_service import (
    LLM_SEED,
    MODEL,
    build_chatbot_system_prompt,
    build_chatbot_user_prompt,
)
from app.services.safety_filter import check_safety, get_safety_response

load_dotenv()
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


async def generate_answer(context: str, question: str, patient: dict, history=None) -> dict:
    """주어진 가이드라인 context로 챗봇 응답 생성 + 토큰 측정. 1차 safety 키워드 체크 포함(양쪽 공통)."""
    if check_safety(question):
        return {
            "answer": get_safety_response(),
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "context_chars": len(context),
            "safety_short_circuit": True,
        }

    system = build_chatbot_system_prompt(context)
    user = build_chatbot_user_prompt(question, patient, history or [])
    resp = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.5,
        seed=LLM_SEED,
        response_format={"type": "json_object"},
        timeout=30.0,
    )
    answer = json.loads(resp.choices[0].message.content)
    return {
        "answer": answer,
        "prompt_tokens": resp.usage.prompt_tokens,
        "completion_tokens": resp.usage.completion_tokens,
        "context_chars": len(context),
        "safety_short_circuit": False,
    }
