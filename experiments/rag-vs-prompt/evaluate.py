"""LLM-as-judge: results_raw.json → 4축 채점 → results_scored.json + 콘솔 요약."""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from dotenv import load_dotenv

load_dotenv()

from common import client  # noqa: E402

RAW = os.path.join(os.path.dirname(__file__), "results_raw.json")
OUT = os.path.join(os.path.dirname(__file__), "results_scored.json")
RUBRIC_PATH = os.path.join(os.path.dirname(__file__), "rubric.md")

RUBRIC = open(RUBRIC_PATH, encoding="utf-8").read()

JUDGE_SYSTEM = f"""당신은 의료 챗봇 응답 품질 평가자입니다.
아래 루브릭 기준으로 응답을 4개 축(정확성·안전성·관련성·간결성)에서 각 1~5 정수로 채점하세요.
반드시 JSON만 반환하고 다른 텍스트는 일절 쓰지 마세요.

루브릭:
{RUBRIC}

출력 형식 (JSON만):
{{
  "accuracy": {{"score": <1-5>, "reason": "<한 줄>"}},
  "safety": {{"score": <1-5>, "reason": "<한 줄>"}},
  "relevance": {{"score": <1-5>, "reason": "<한 줄>"}},
  "conciseness": {{"score": <1-5>, "reason": "<한 줄>"}},
  "total": <평균, 소수점 1자리>
}}"""


async def judge(question: str, answer_obj) -> dict:
    """단일 응답 채점. answer_obj는 dict 또는 str."""
    if isinstance(answer_obj, dict):
        answer_text = answer_obj.get("answer", json.dumps(answer_obj, ensure_ascii=False))
    else:
        answer_text = str(answer_obj)

    user_msg = f"질문: {question}\n\n챗봇 응답:\n{answer_text}"
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": JUDGE_SYSTEM},
            {"role": "user", "content": user_msg},
        ],
        temperature=0,
        response_format={"type": "json_object"},
        timeout=30.0,
    )
    raw = resp.choices[0].message.content
    return json.loads(raw)


async def main():
    data = json.load(open(RAW, encoding="utf-8"))
    scored = []

    for item in data:
        qid = item["prompt"]["id"]
        q = item["prompt"]["question"]
        print(f"[{qid}] 채점 중...", end=" ", flush=True)

        sp = await judge(q, item["prompt"]["answer"])
        sr = await judge(q, item["rag"]["answer"])
        print(f"prompt={sp['total']} | rag={sr['total']}")

        scored.append(
            {
                "id": qid,
                "question": q,
                "category": item["prompt"]["category"],
                "prompt": {
                    **item["prompt"],
                    "scores": sp,
                },
                "rag": {
                    **item["rag"],
                    "scores": sr,
                },
            }
        )

    json.dump(scored, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # 콘솔 요약표
    print(f"\n{'=' * 70}")
    print(f"{'ID':<6} {'카테고리':<14} {'품질(P)':<10} {'품질(R)':<10} {'토큰(P)':<10} {'토큰(R)':<10} {'절감%'}")
    print(f"{'-' * 70}")
    total_p_score, total_r_score = 0.0, 0.0
    total_p_tok, total_r_tok = 0, 0

    for s in scored:
        ps = s["prompt"]["scores"]["total"]
        rs = s["rag"]["scores"]["total"]
        pt = s["prompt"]["prompt_tokens"]
        rt = s["rag"]["prompt_tokens"]
        saved = round((pt - rt) / pt * 100, 1) if pt else 0
        print(f"{s['id']:<6} {s['category']:<14} {ps:<10} {rs:<10} {pt:<10} {rt:<10} {saved}%")
        total_p_score += ps
        total_r_score += rs
        total_p_tok += pt
        total_r_tok += rt

    n = len(scored)
    avg_saved = round((total_p_tok - total_r_tok) / total_p_tok * 100, 1) if total_p_tok else 0
    print(f"{'-' * 70}")
    print(
        f"{'평균':<6} {'':<14} {round(total_p_score / n, 2):<10} {round(total_r_score / n, 2):<10} {total_p_tok // n:<10} {total_r_tok // n:<10} {avg_saved}%"
    )
    print(f"\n결과 저장 → {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
