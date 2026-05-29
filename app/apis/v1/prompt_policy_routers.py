from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.dependencies.security import get_request_user
from app.models.users import User
from app.services import prompt_policies as prompt_policies_service

prompt_policy_router = APIRouter(prefix="/prompt-policies", tags=["Prompt Policies"])


@prompt_policy_router.get("")
async def get_prompt_policies(
    user: Annotated[User, Depends(get_request_user)],
    target_type: str | None = Query(default=None),
):
    return await prompt_policies_service.get_prompt_policies(target_type)
