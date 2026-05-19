from tortoise.transactions import in_transaction

from app.core.utils.security import hash_password, verify_password
from app.dtos.users import UserUpdateRequest
from app.exceptions.common import BadRequestException, UnauthorizedException
from app.models.users import User
from app.repositories.user_repository import UserRepository


class UserManageService:
    def __init__(self):
        self.repo = UserRepository()

    async def update_user(self, user: User, data: UserUpdateRequest) -> User:
        async with in_transaction():
            await self.repo.update_instance(user=user, data=data.model_dump(exclude_none=True))
            await user.refresh_from_db()
        return user

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise UnauthorizedException(detail="현재 비밀번호가 일치하지 않습니다.")
        if current_password == new_password:
            raise BadRequestException(detail="새 비밀번호는 현재 비밀번호와 달라야 합니다.")
        user.password_hash = hash_password(new_password)
        await user.save()
