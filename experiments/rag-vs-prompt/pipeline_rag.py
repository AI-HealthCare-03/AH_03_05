"""② RAG 방식: 환자 질환 로어북을 청킹·임베딩하여 질문 관련 top-k 청크만 주입."""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from common import client, generate_answer

from app.services.guideline_loader import get_guideline_context

CHUNK_SIZE = 500
OVERLAP = 100
EMBED_MODEL = "text-embedding-3-small"
TOP_K = 4


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> list[str]:
    chunks, i = [], 0
    while i < len(text):
        piece = text[i : i + size]
        if piece.strip():
            chunks.append(piece)
        i += size - overlap
    return chunks


def cosine(a, b) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(x * x for x in b) ** 0.5
    return dot / (na * nb + 1e-9)


async def embed(texts: list[str]) -> list[list[float]]:
    resp = await client.embeddings.create(model=EMBED_MODEL, input=texts)
    return [d.embedding for d in resp.data]


async def run_rag(case: dict, top_k: int = TOP_K) -> dict:
    patient = case["patient"]
    full = get_guideline_context(patient["chronic_diseases"], patient["age_group"])
    chunks = chunk_text(full)

    if not chunks:
        result = await generate_answer("", case["question"], patient)
        result.update(method="rag", id=case["id"], num_chunks=0, retrieved=0)
        return result

    vecs = await embed(chunks)
    qvec = (await embed([case["question"]]))[0]
    top = sorted(range(len(chunks)), key=lambda i: cosine(qvec, vecs[i]), reverse=True)[: min(top_k, len(chunks))]
    retrieved = "\n\n".join(chunks[i] for i in top)

    result = await generate_answer(retrieved, case["question"], patient)
    result.update(method="rag", id=case["id"], num_chunks=len(chunks), retrieved=len(top))
    return result


async def _smoke_test():
    cases = json.load(open(os.path.join(os.path.dirname(__file__), "dataset.json"), encoding="utf-8"))
    case = cases[0]
    print(f"[{case['id']}] {case['question']}")
    r = await run_rag(case)
    print(
        f"chunks {r['num_chunks']} -> retrieved {r['retrieved']} | context_chars: {r['context_chars']} | prompt_tokens: {r['prompt_tokens']}"
    )
    print("answer:", r["answer"].get("answer", r["answer"]))


if __name__ == "__main__":
    asyncio.run(_smoke_test())
