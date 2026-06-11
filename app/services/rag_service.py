import os

from openai import AsyncOpenAI

from app.models.guideline_chunks import GuidelineChunk
from app.models.guideline_sources import EmbeddingStatus, GuidelineSource

EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 500


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def split_text(text: str, chunk_size: int = CHUNK_SIZE) -> list[str]:
    """텍스트를 청크 단위로 분할 (한국어 고려 문자 단위 분할)"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end < len(text):
            for sep in ["다. ", "요. ", "다.\n", "요.\n"]:
                pos = text.rfind(sep, start, end)
                if pos != -1:
                    end = pos + len(sep)
                    break
        chunks.append(text[start:end].strip())
        start = end
    return [c for c in chunks if c]


async def get_embedding(text: str) -> list[float]:
    """OpenAI 임베딩 생성"""
    response = await _get_client().embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """코사인 유사도 계산"""
    dot_product = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = sum(x**2 for x in a) ** 0.5
    norm_b = sum(x**2 for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


async def embed_guideline_source(source_id: int, text: str) -> None:
    """가이드라인 출처 텍스트를 청크로 분할하고 임베딩 생성 후 저장"""
    source = await GuidelineSource.get(id=source_id)
    await source.update_from_dict({"embedding_status": EmbeddingStatus.PROCESSING})
    await source.save()

    try:
        chunks = split_text(text)
        for idx, chunk_text in enumerate(chunks):
            embedding = await get_embedding(chunk_text)
            await GuidelineChunk.create(
                source=source,
                chunk_text=chunk_text,
                chunk_index=idx,
                embedding=embedding,
            )
        await source.update_from_dict({"embedding_status": EmbeddingStatus.COMPLETED})
        await source.save()
    except Exception as e:
        await source.update_from_dict({"embedding_status": EmbeddingStatus.FAILED})
        await source.save()
        raise e


async def search_similar_chunks(
    query: str,
    top_k: int = 3,
    threshold: float = 0.7,
) -> list[dict]:
    """쿼리와 유사한 가이드라인 청크 검색
    현재는 전체 청크 로드 후 파이썬 유사도 계산 방식.
    청크 증가 시 pgvector 네이티브 타입으로 고도화 예정.
    """
    query_embedding = await get_embedding(query)
    chunks = await GuidelineChunk.all().prefetch_related("source")

    results = []
    for chunk in chunks:
        if chunk.embedding is None:
            continue
        similarity = cosine_similarity(query_embedding, chunk.embedding)
        if similarity >= threshold:
            results.append(
                {
                    "chunk_text": chunk.chunk_text,
                    "similarity": similarity,
                    "source_id": chunk.source_id,
                    "organization_name": chunk.source.organization_name,
                    "guideline_title": chunk.source.guideline_title,
                }
            )

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]


async def get_rag_context(query: str, top_k: int = 3) -> str:
    """RAG 검색 결과를 LLM 컨텍스트 형식으로 반환"""
    chunks = await search_similar_chunks(query, top_k=top_k)
    if not chunks:
        return ""

    context_parts = []
    for chunk in chunks:
        context_parts.append(
            f"[출처: {chunk['organization_name']} - {chunk['guideline_title']}]\n{chunk['chunk_text']}"
        )

    return "\n\n---\n\n".join(context_parts)
