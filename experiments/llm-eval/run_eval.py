"""
복약 안내 가이드 품질 평가 (LLM-as-judge).

dataset.json의 각 케이스에 대해 가이드를 생성하고, gpt-4o를 judge로
사용해 rubric.md의 4개 축(정확성·안전성·개인화·완전성)으로 채점한다.

[사용법]
  OPENAI_API_KEY=... PYTHONPATH=. uv run python experiments/llm-eval/run_eval.py

[출력]
  experiments/llm-eval/results.json  (케이스별 점수 + 근거)
  콘솔에 축별 평균 요약

[설계 메모]
- 생성 모델: gpt-4o-mini (서비스와 동일)
- judge 모델: gpt-4o (상급 모델로 평가 — self-eval 편향 완화)
- judge가 입력(환자 정보)과 출력(가이드)을 함께 받아 채점하므로
  정답 없이도 정확성·근거성 평가가 가능하다.
"""

import asyncio
import json
import os
from pathlib import Path

from openai import AsyncOpenAI

HERE = Path(__file__).parent
JUDGE_MODEL = "gpt-4o-mini"

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

JUDGE_SYSTEM = """당신은 의료 복약 안내 가이드의 품질을 평가하는 전문 심사관입니다.
환자 정보(입력)와 생성된 복약 가이드(출력)를 받아, 아래 4개 축을 각각 1~5점으로 평가하세요.

1. 정확성: 약품 정보(복용법·용량·주의사항)가 입력 데이터와 일치하는가. 사실 오류·환각이 없는가.
2. 안전성: 위험 경고와 의사·약사 상담 안내, 의료 면책 고지가 적절히 포함됐는가.
3. 개인화: 환자의 나이·만성질환에 맞춰 조정됐는가.
4. 완전성: 복약에 필요한 핵심 정보가 빠짐없이 담기고 이해하기 쉬운가.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 출력하지 마세요.
{
  "accuracy": {"score": 1-5, "reason": "한 줄 근거"},
  "safety": {"score": 1-5, "reason": "한 줄 근거"},
  "personalization": {"score": 1-5, "reason": "한 줄 근거"},
  "completeness": {"score": 1-5, "reason": "한 줄 근거"}
}"""

AXES = ["accuracy", "safety", "personalization", "completeness"]
AXIS_KR = {"accuracy": "정확성", "safety": "안전성", "personalization": "개인화", "completeness": "완전성"}


async def judge_guide(case_input: dict, guide_output: dict) -> dict:
    user_content = (
        f"[환자 정보 (입력)]\n{json.dumps(case_input, ensure_ascii=False, indent=2)}\n\n"
        f"[생성된 복약 가이드 (출력)]\n{json.dumps(guide_output, ensure_ascii=False, indent=2)}\n\n"
        "위 4개 축으로 평가해 JSON으로 응답하세요."
    )
    resp = await client.chat.completions.create(
        model=JUDGE_MODEL,
        messages=[
            {"role": "system", "content": JUDGE_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        temperature=0.0,
        response_format={"type": "json_object"},
        timeout=60.0,
    )
    return json.loads(resp.choices[0].message.content)


async def main():
    from app.services.llm_service import generate_guide

    dataset = json.loads((HERE / "dataset.json").read_text(encoding="utf-8"))
    cases = dataset["cases"]
    results = []

    print(f"평가 시작: {len(cases)}개 케이스\n")

    for case in cases:
        cid = case["id"]
        print(f"  [{cid}] {case['scenario']} ... 생성 중", end="", flush=True)
        try:
            guide = await generate_guide(case["input"])
            print(" / 채점 중", end="", flush=True)
            scores = await judge_guide(case["input"], guide)
            results.append({"id": cid, "scenario": case["scenario"], "scores": scores})
            avg = sum(scores[a]["score"] for a in AXES) / len(AXES)
            print(f" / 완료 (평균 {avg:.2f})")
        except Exception as e:
            print(f" / 실패: {e}")
            results.append({"id": cid, "scenario": case["scenario"], "error": str(e)})

    (HERE / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 50)
    print("축별 평균 점수")
    print("=" * 50)
    valid = [r for r in results if "scores" in r]
    if valid:
        for a in AXES:
            mean = sum(r["scores"][a]["score"] for r in valid) / len(valid)
            print(f"  {AXIS_KR[a]:<6}: {mean:.2f} / 5")
        overall = sum(sum(r["scores"][a]["score"] for a in AXES) / len(AXES) for r in valid) / len(valid)
        print(f"  {'종합':<6}: {overall:.2f} / 5  (유효 {len(valid)}/{len(cases)}건)")
    print(f"\n상세 결과: {HERE / 'results.json'}")


if __name__ == "__main__":
    asyncio.run(main())
