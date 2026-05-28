from fastapi import APIRouter, Depends, Query

from app.dependencies.security import get_request_user
from app.dtos.guideline_sources import GuidelineSourceCreateRequest
from app.services import guideline_sources as guideline_sources_service

rag_router = APIRouter(prefix="/rag", tags=["RAG"])


@rag_router.post("/guideline-sources", status_code=201)
async def create_guideline_source(
    request: GuidelineSourceCreateRequest,
    current_user=Depends(get_request_user),
):
    return await guideline_sources_service.create_guideline_source(request)


@rag_router.get("/guideline-sources")
async def list_guideline_sources(
    topic: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user=Depends(get_request_user),
):
    return await guideline_sources_service.list_guideline_sources(topic, page, size)


@rag_router.get("/search")
async def search_guidelines(query: str):
    return {
        "query": query,
        "sources": [],
    }
