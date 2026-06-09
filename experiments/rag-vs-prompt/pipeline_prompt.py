"""① 프롬프트 방식: 질환별 로어북 전체를 프롬프트에 주입 (현행 baseline)."""
import asyncio, json, os, sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.services.guideline_loader import get_guideline_context
from common import generate_answer


async def run_prompt(case: dict) -> dict:
    patient = case["patient"]
    context = get_guideline_context(patient["chronic_diseases"], patient["age_group"])
    result = await generate_answer(context, case["question"], patient)
    result["method"] = "prompt"
    result["id"] = case["id"]
    return result


async def _smoke_test():
    path = os.path.join(os.path.dirname(__file__), "dataset.json")
    cases = json.load(open(path, encoding="utf-8"))
    case = cases[0]  # Q01: 고혈압+당뇨+이상지질혈증
    print(f"[{case['id']}] {case['question']}")
    r = await run_prompt(case)
    print("context_chars:", r["context_chars"], "| prompt_tokens:", r["prompt_tokens"])
    print("answer:", r["answer"].get("answer", r["answer"]))


if __name__ == "__main__":
    asyncio.run(_smoke_test())
