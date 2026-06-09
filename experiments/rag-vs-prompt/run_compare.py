"""9케이스 × ①프롬프트/②RAG 전체 실행 → results_raw.json 저장."""

import asyncio
import json
import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from dotenv import load_dotenv

load_dotenv()

from pipeline_prompt import run_prompt  # noqa: E402
from pipeline_rag import run_rag  # noqa: E402

DATASET = os.path.join(os.path.dirname(__file__), "dataset.json")
OUT = os.path.join(os.path.dirname(__file__), "results_raw.json")


async def main():
    cases = json.load(open(DATASET, encoding="utf-8"))
    results = []

    for case in cases:
        qid = case["id"]
        q = case["question"]
        print(f"\n{'=' * 50}")
        print(f"[{qid}] {q}")

        # ① 프롬프트
        t0 = time.perf_counter()
        rp = await run_prompt(case)
        rp["elapsed_sec"] = round(time.perf_counter() - t0, 2)
        rp["question"] = q
        rp["category"] = case["category"]
        answer_text = (
            rp["answer"].get("answer", str(rp["answer"])) if isinstance(rp["answer"], dict) else str(rp["answer"])
        )
        print(f"  [prompt] tokens={rp['prompt_tokens']} | chars={rp['context_chars']} | {rp['elapsed_sec']}s")
        print(f"           {answer_text[:80]}...")

        # ② RAG
        t0 = time.perf_counter()
        rr = await run_rag(case)
        rr["elapsed_sec"] = round(time.perf_counter() - t0, 2)
        rr["question"] = q
        rr["category"] = case["category"]
        answer_text = (
            rr["answer"].get("answer", str(rr["answer"])) if isinstance(rr["answer"], dict) else str(rr["answer"])
        )
        print(
            f"  [rag]    tokens={rr['prompt_tokens']} | chars={rr['context_chars']} | chunks {rr['num_chunks']}→{rr['retrieved']} | {rr['elapsed_sec']}s"
        )
        print(f"           {answer_text[:80]}...")

        results.append({"prompt": rp, "rag": rr})

    json.dump(results, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n\n결과 저장 완료 → {OUT}")
    print(f"총 {len(results)}케이스 / 각 2방식 = {len(results) * 2}건")


if __name__ == "__main__":
    asyncio.run(main())
