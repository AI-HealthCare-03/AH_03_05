from tortoise.transactions import in_transaction

from app.core.utils.common import normalize_phone_number
from app.dtos.users import UserUpdateRequest
from app.models.users import User
from app.repositories.user_repository import UserRepository
<<<<<<< HEAD
from app.services.auth import AuthService
=======
>>>>>>> develop


class UserManageService:
    def __init__(self):
        self.repo = UserRepository()

    async def update_user(self, user: User, data: UserUpdateRequest) -> User:
        async with in_transaction():
            await self.repo.update_instance(user=user, data=data.model_dump(exclude_none=True))
            await user.refresh_from_db()
        return user
