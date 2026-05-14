from fastapi import APIRouter

rag_router = APIRouter(prefix="/rag", tags=["RAG"])


@rag_router.get("/search")
async def search_guidelines(query: str):
    return {
        "query": query,
        "sources": [
            {
                "organization_name": "대한고혈압학회",
                "guideline_title": "고혈압 생활요법 가이드",
                "source_url": "https://example.org",
                "chunk_text": "나트륨 섭취를 줄이고 규칙적인 운동을 권장합니다.",
                "similarity_score": 0.82,
            }
        ],
    }


@rag_router.get("/guideline-sources")
async def list_guideline_sources():
    return {
        "sources": [
            {
                "source_id": 1,
                "organization_name": "대한고혈압학회",
                "guideline_title": "고혈압 생활요법 가이드",
                "disease_or_topic": "hypertension",
                "source_url": "https://example.org",
            }
        ],
    }