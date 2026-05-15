from datetime import datetime
from pydantic import BaseModel, Field
from typing import Annotated
from app.dtos.base import BaseSerializerModel
=======

from pydantic import BaseModel, EmailStr, Field

from app.core.validators import optional_after_validator, validate_birthday, validate_phone_number
from app.dtos.base import BaseSerializerModel
from app.models.users import Gender
>>>>>>> 386c79f6c7787a714c964ff8ae13b58f8434e58d


class UserUpdateRequest(BaseModel):
    name: Annotated[str | None, Field(None, min_length=2, max_length=20)]
    nickname: Annotated[str | None, Field(None, max_length=100)]


class UserInfoResponse(BaseSerializerModel):
    id: int
    email: str
    name: str
    nickname: str | None
    created_at: datetime
