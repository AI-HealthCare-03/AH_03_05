from app.dtos.prompt_policies import PromptPolicyResponse
from app.models.prompt_policies import PromptPolicy, PromptTargetType


async def get_prompt_policies(target_type: str | None = None) -> dict:
    """프롬프트 정책 목록 조회"""
    query = PromptPolicy.all()
    if target_type:
        query = query.filter(target_type=target_type)

    policies = await query.order_by("target_type")

    return {
        "items": [
            PromptPolicyResponse(
                policy_id=p.id,
                target_type=p.target_type,
                prompt_version=p.prompt_version,
                description=p.description,
                is_active=p.is_active,
                created_at=p.created_at,
            )
            for p in policies
        ]
    }


async def seed_default_policies() -> None:
    """기본 프롬프트 정책 초기 데이터 삽입"""
    defaults = [
        {
            "target_type": PromptTargetType.GUIDE,
            "prompt_version": "guide-v1",
            "description": "복약/생활습관 가이드 생성 프롬프트 v1",
            "is_active": True,
        },
        {
            "target_type": PromptTargetType.CHAT,
            "prompt_version": "chat-v1",
            "description": "일상 복약 생활 도우미 챗봇 프롬프트 v1",
            "is_active": True,
        },
        {
            "target_type": PromptTargetType.CHALLENGE,
            "prompt_version": "challenge-v1",
            "description": "생활습관 챌린지 생성 프롬프트 v1",
            "is_active": True,
        },
    ]
    for data in defaults:
        await PromptPolicy.get_or_create(
            target_type=data["target_type"],
            defaults=data,
        )
