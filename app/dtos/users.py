from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field

from app.core.validators import optional_after_validator, validate_birthday, validate_phone_number
from app.dtos.base import BaseSerializerModel
<<<<<<< HEAD
from app.models.users import Gender
=======
>>>>>>> develop


class UserUpdateRequest(BaseModel):
    name: Annotated[str | None, Field(None, min_length=2, max_length=20)]
    nickname: Annotated[str | None, Field(None, max_length=100)]


class UserInfoResponse(BaseSerializerModel):
    id: int = Field(serialization_alias="user_id")
    email: str
    name: str
    nickname: str | None
    status: str
    created_at: datetime
