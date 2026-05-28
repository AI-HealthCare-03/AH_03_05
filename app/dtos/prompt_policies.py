from datetime import datetime

from pydantic import BaseModel


class PromptPolicyResponse(BaseModel):
    policy_id: int
    target_type: str
    prompt_version: str
    description: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
