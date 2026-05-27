from datetime import UTC, datetime, timedelta

from tortoise.transactions import in_transaction

from app.core.utils.security import hash_password, verify_password
from app.dtos.users import UserUpdateRequest
from app.exceptions.common import BadRequestException
from app.models.users import User
from app.repositories.user_repository import UserRepository


class UserManageService:
    def __init__(self):
        self.repo = UserRepository()

    async def update_user(self, user: User, data: UserUpdateRequest) -> User:
        if data.nickname is not None and data.nickname != user.nickname:
            if user.nickname_updated_at is not None:
                next_available = user.nickname_updated_at + timedelta(days=30)
                if datetime.now(UTC) < next_available:
                    next_date = next_available.strftime("%Y.%m.%d")
                    raise BadRequestException(detail=f"닉네임은 30일에 1회만 변경할 수 있어요. 다음 변경 가능일: {next_date}")
        async with in_transaction():
            update_data = data.model_dump(exclude_none=True)
            if "nickname" in update_data and update_data["nickname"] != user.nickname:
                update_data["nickname_updated_at"] = datetime.now(UTC)
            await self.repo.update_instance(user=user, data=update_data)
            await user.refresh_from_db()
        return user

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        from datetime import UTC, datetime

        from app.models.auth_tokens import AuthToken

        if not verify_password(current_password, user.password_hash):
            raise BadRequestException(detail="현재 비밀번호가 일치하지 않습니다.")
        if current_password == new_password:
            raise BadRequestException(detail="새 비밀번호는 현재 비밀번호와 달라야 합니다.")

        async with in_transaction():
            user.password_hash = hash_password(new_password)
            await user.save()
            await AuthToken.filter(user=user).update(revoked_at=datetime.now(UTC))

    async def withdraw_user(self, user: User, password: str) -> None:
        from datetime import UTC, datetime

        from app.models.auth_tokens import AuthToken
        from app.models.users import UserStatus

        if not verify_password(password, user.password_hash):
            raise BadRequestException(detail="비밀번호가 일치하지 않습니다.")

        async with in_transaction():
            user.status = UserStatus.WITHDRAWN
            user.withdrawn_at = datetime.now(UTC)
            await user.save()
            await AuthToken.filter(user=user).update(revoked_at=datetime.now(UTC))
            # TODO: 진행 중인 processing_jobs cancelled 처리 (이정훈님 연동 필요)
