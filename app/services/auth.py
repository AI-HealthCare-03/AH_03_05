from datetime import UTC, datetime

from pydantic import EmailStr
from tortoise.transactions import in_transaction

from app.core.jwt.tokens import AccessToken, RefreshToken
from app.core.redis import redis_client
from app.core.utils.security import hash_password, verify_password
from app.dtos.auth import LoginRequest, SignUpRequest
from app.exceptions import (
    DuplicateEmailException,
    InvalidConsentException,
    InvalidCredentialsException,
    WithdrawnUserException,
)
from app.exceptions.common import TooManyRequestsException, UnauthorizedException
from app.models.auth_tokens import AuthToken
from app.models.user_consents import ConsentType, RequiredType, UserConsent
from app.models.users import User, UserStatus
from app.services.jwt import JwtService

LOGIN_FAIL_KEY = "login_fail:{email}"
LOGIN_FAIL_LIMIT = 5
LOGIN_FAIL_TTL = 600  # 10분


class AuthService:
    def __init__(self):
        self.jwt_service = JwtService()

    async def signup(self, data: SignUpRequest) -> User:
        await self.check_email_exists(data.email)
        required_types = {
            ConsentType.TERMS,
            ConsentType.PRIVACY,
            ConsentType.SENSITIVE_HEALTH,
            ConsentType.AI_ANALYSIS,
        }
        agreed_types = {ConsentType(c.consent_type) for c in data.consents if c.is_agreed}
        if not required_types.issubset(agreed_types):
            raise InvalidConsentException()
        async with in_transaction():
            user = await User.create(
                email=data.email,
                password_hash=hash_password(data.password),
                name=data.name,
                nickname=data.nickname,
                status=UserStatus.ACTIVE,
            )
            for consent in data.consents:
                consent_type = ConsentType(consent.consent_type)
                required_type = RequiredType.REQUIRED if consent_type in required_types else RequiredType.OPTIONAL
                await UserConsent.create(
                    user=user,
                    consent_type=consent_type,
                    required_type=required_type,
                    is_agreed=consent.is_agreed,
                )
            return user

    async def authenticate(self, data: LoginRequest) -> User:
        email = str(data.email)
        redis_key = LOGIN_FAIL_KEY.format(email=email)
        fail_count = await redis_client.get(redis_key)
        if fail_count and int(fail_count) >= LOGIN_FAIL_LIMIT:
            raise TooManyRequestsException(detail="로그인 시도 횟수를 초과했습니다. 10분 후 다시 시도해주세요.")
        user = await User.get_or_none(email=email)
        if not user or not verify_password(data.password, user.password_hash):
            await redis_client.incr(redis_key)
            await redis_client.expire(redis_key, LOGIN_FAIL_TTL)
            raise InvalidCredentialsException()
        if user.status == UserStatus.WITHDRAWN:
            raise WithdrawnUserException()
        await redis_client.delete(redis_key)
        return user

    async def login(self, user: User) -> dict[str, AccessToken | RefreshToken]:
        user.last_login_at = datetime.now(UTC)
        await user.save()
        return self.jwt_service.issue_jwt_pair(user)

    async def logout(self, refresh_token: str) -> None:
        token = await AuthToken.get_or_none(refresh_token=refresh_token)
        if token:
            token.revoked_at = datetime.now(UTC)
            await token.save()

    async def refresh(self, refresh_token: str) -> dict:
        token = await AuthToken.get_or_none(refresh_token=refresh_token)
        if not token or token.revoked_at is not None:
            raise UnauthorizedException(detail="유효하지 않은 refresh token입니다.")
        user = await token.user
        if user.status == UserStatus.WITHDRAWN:
            raise UnauthorizedException(detail="탈퇴한 계정입니다.")
        token.revoked_at = datetime.now(UTC)
        await token.save()
        return self.jwt_service.issue_jwt_pair(user)

    async def check_email_exists(self, email: str | EmailStr) -> None:
        if await User.exists(email=email):
            raise DuplicateEmailException()
