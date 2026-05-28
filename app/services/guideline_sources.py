from app.dtos.guideline_sources import GuidelineSourceCreateRequest, GuidelineSourceResponse
from app.models.guideline_sources import EmbeddingStatus, GuidelineSource


async def create_guideline_source(request: GuidelineSourceCreateRequest) -> GuidelineSourceResponse:
    """가이드라인 출처 등록"""
    source = await GuidelineSource.create(
        organization_name=request.organization_name,
        guideline_title=request.guideline_title,
        source_url=request.source_url,
        disease_or_topic=request.disease_or_topic,
        embedding_status=EmbeddingStatus.PENDING,
    )
    return GuidelineSourceResponse(
        guideline_source_id=source.id,
        organization_name=source.organization_name,
        guideline_title=source.guideline_title,
        source_url=source.source_url,
        disease_or_topic=source.disease_or_topic,
        embedding_status=source.embedding_status,
        created_at=source.created_at,
    )


async def list_guideline_sources(
    topic: str | None = None,
    page: int = 1,
    size: int = 20,
) -> dict:
    """가이드라인 출처 목록 조회"""
    query = GuidelineSource.all()
    if topic:
        query = query.filter(disease_or_topic=topic)

    total = await query.count()
    sources = await query.offset((page - 1) * size).limit(size)

    return {
        "items": [
            GuidelineSourceResponse(
                guideline_source_id=s.id,
                organization_name=s.organization_name,
                guideline_title=s.guideline_title,
                source_url=s.source_url,
                disease_or_topic=s.disease_or_topic,
                embedding_status=s.embedding_status,
                created_at=s.created_at,
            )
            for s in sources
        ],
        "total": total,
        "page": page,
        "size": size,
    }
