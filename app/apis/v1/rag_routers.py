from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.dependencies.security import get_request_user
from app.dtos.guideline_sources import GuidelineSourceCreateRequest
from app.models.users import User
from app.services import guideline_sources as guideline_sources_service
from app.services import rag_service

rag_router = APIRouter(prefix="/rag", tags=["RAG"])


@rag_router.post("/guideline-sources", status_code=201)
async def create_guideline_source(
    request: GuidelineSourceCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
):
    return await guideline_sources_service.create_guideline_source(request)


@rag_router.get("/guideline-sources")
async def list_guideline_sources(
    user: Annotated[User, Depends(get_request_user)],
    topic: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    return await guideline_sources_service.list_guideline_sources(topic, page, size)


@rag_router.get("/search")
async def search_guidelines(
    user: Annotated[User, Depends(get_request_user)],
    query: str = Query(...),
    top_k: int = Query(default=3, ge=1, le=10),
):
    results = await rag_service.search_similar_chunks(query, top_k=top_k)
    return {
        "query": query,
        "sources": results,
    }
