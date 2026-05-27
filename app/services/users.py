from datetime import UTC, datetime, timedelta

from tortoise.transactions import in_transaction

from app.core.redis import redis_client
from app.core.utils.security import hash_password, verify_password
from app.dtos.users import UserUpdateRequest
from app.exceptions.common import BadRequestException, NicknameTooSoonException, TooManyRequestsException
from app.models.users import User
from app.repositories.user_repository import UserRepository

PW_CHANGE_FAIL_KEY = "pw_change_fail:{user_id}"
PW_CHANGE_FAIL_LIMIT = 5
PW_CHANGE_FAIL_TTL = 600  # 10분


class UserManageService:
    def __init__(self):
        self.repo = UserRepository()

    async def update_user(self, user: User, data: UserUpdateRequest) -> User:
        if data.nickname is not None and data.nickname != user.nickname:
            if user.nickname_updated_at is not None:
                next_available = user.nickname_updated_at + timedelta(days=30)
                if datetime.now(UTC) < next_available:
                    next_date = next_available.strftime("%Y.%m.%d")
                    raise NicknameTooSoonException(next_date=next_date)
        async with in_transaction():
            update_data = data.model_dump(exclude_none=True)
            if "nickname" in update_data and update_data["nickname"] != user.nickname:
                update_data["nickname_updated_at"] = datetime.now(UTC)
            await self.repo.update_instance(user=user, data=update_data)
            await user.refresh_from_db()
        return user

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        from app.models.auth_tokens import AuthToken

        redis_key = PW_CHANGE_FAIL_KEY.format(user_id=user.id)
        fail_count = await redis_client.get(redis_key)
        if fail_count and int(fail_count) >= PW_CHANGE_FAIL_LIMIT:
            raise TooManyRequestsException(detail="비밀번호 변경 시도 횟수를 초과했습니다. 10분 후 다시 시도해주세요.")
        if not verify_password(current_password, user.password_hash):
            await redis_client.incr(redis_key)
            await redis_client.expire(redis_key, PW_CHANGE_FAIL_TTL)
            raise BadRequestException(detail="현재 비밀번호가 일치하지 않습니다.")
        if current_password == new_password:
            raise BadRequestException(detail="새 비밀번호는 현재 비밀번호와 달라야 합니다.")
        async with in_transaction():
            user.password_hash = hash_password(new_password)
            user.password_changed_at = datetime.now(UTC)
            await user.save()
            await AuthToken.filter(user=user).update(revoked_at=datetime.now(UTC))
        await redis_client.delete(redis_key)

    async def withdraw_user(self, user: User, password: str) -> None:
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
