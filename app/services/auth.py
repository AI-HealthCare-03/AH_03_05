import hmac
import secrets
import string
from datetime import UTC, datetime

from pydantic import EmailStr
from tortoise.transactions import in_transaction

from app.core.jwt.tokens import AccessToken, RefreshToken
from app.core.redis import redis_client
from app.core.smtp import send_email
from app.core.utils.security import hash_password, verify_password
from app.dtos.auth import LoginRequest, SignUpRequest
from app.exceptions import (
    DuplicateEmailException,
    InvalidConsentException,
    InvalidCredentialsException,
    WithdrawnUserException,
)
from app.exceptions.common import BadRequestException, TooManyRequestsException, UnauthorizedException
from app.models.auth_tokens import AuthToken
from app.models.user_consents import ConsentType, RequiredType, UserConsent
from app.models.users import User, UserStatus
from app.services.jwt import JwtService

LOGIN_FAIL_KEY = "login_fail:{email}"
LOGIN_FAIL_LIMIT = 5
LOGIN_FAIL_TTL = 600  # 10분

PW_RESET_COOLDOWN_KEY = "pw_reset_cooldown:{email}"
PW_RESET_COOLDOWN_TTL = 60  # 1분

PW_RESET_FAIL_KEY = "pw_reset_fail:{email}"
PW_RESET_FAIL_LIMIT = 5

EMAIL_VERIFY_FAIL_KEY = "email_verify_fail:{email}"
EMAIL_VERIFY_FAIL_LIMIT = 5


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
                    agreed_at=datetime.now(UTC) if consent.is_agreed else None,
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
            new_count = await redis_client.incr(redis_key)
            # 첫 실패 시에만 TTL 설정 — 매번 갱신하면 잠금 우회 가능
            if new_count == 1:
                await redis_client.expire(redis_key, LOGIN_FAIL_TTL)
            raise InvalidCredentialsException()
        if user.status == UserStatus.WITHDRAWN:
            raise WithdrawnUserException()
        await redis_client.delete(redis_key)
        return user

    async def login(self, user: User) -> dict[str, AccessToken | RefreshToken]:
        user.last_login_at = datetime.now(UTC)
        await user.save()
        tokens = self.jwt_service.issue_jwt_pair(user)
        rt = tokens["refresh_token"]
        await AuthToken.create(
            user=user,
            refresh_token=str(rt),
            expires_at=rt.current_time + rt.lifetime,
        )
        return tokens

    async def logout(self, refresh_token: str) -> None:
        token = await AuthToken.get_or_none(refresh_token=refresh_token)
        if not token:
            from app.exceptions.common import UnauthorizedException

            raise UnauthorizedException(detail="유효하지 않은 refresh token입니다.")
        token.revoked_at = datetime.now(UTC)
        await token.save()

    async def refresh(self, refresh_token: str) -> dict:
        token = await AuthToken.get_or_none(refresh_token=refresh_token)
        if not token or token.revoked_at is not None:
            raise UnauthorizedException(detail="유효하지 않은 refresh token입니다.")
        if token.expires_at < datetime.now(UTC):
            raise UnauthorizedException(detail="만료된 refresh token입니다.")
        user = await token.user
        if user.status == UserStatus.WITHDRAWN:
            raise UnauthorizedException(detail="탈퇴한 계정입니다.")
        token.revoked_at = datetime.now(UTC)
        await token.save()
        new_tokens = self.jwt_service.issue_jwt_pair(user)
        new_rt = new_tokens["refresh_token"]
        await AuthToken.create(
            user=user,
            refresh_token=str(new_rt),
            expires_at=new_rt.current_time + new_rt.lifetime,
        )
        return new_tokens

    async def request_password_reset(self, email: str) -> None:
        cooldown_key = PW_RESET_COOLDOWN_KEY.format(email=email)
        if await redis_client.get(cooldown_key):
            raise TooManyRequestsException(detail="잠시 후 다시 시도해주세요. (1분 cooldown)")
        user = await User.get_or_none(email=email)
        if not user:
            return
        code = "".join(secrets.choice(string.digits) for _ in range(6))
        redis_key = f"pw_reset:{email}"
        await redis_client.set(redis_key, code, ex=600)
        await redis_client.set(cooldown_key, "1", ex=PW_RESET_COOLDOWN_TTL)
        body = f"""
        <h2>MediPT 비밀번호 재설정</h2>
        <p>아래 인증 코드를 입력해주세요. (10분 내 유효)</p>
        <h1 style="letter-spacing: 4px;">{code}</h1>
        <p>본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</p>
        """
        await send_email(to=email, subject="[MediPT] 비밀번호 재설정 인증 코드", body=body)

    async def confirm_password_reset(self, email: str, code: str, new_password: str) -> None:
        redis_key = f"pw_reset:{email}"
        fail_key = PW_RESET_FAIL_KEY.format(email=email)
        stored_code = await redis_client.get(redis_key)
        if not stored_code or not hmac.compare_digest(stored_code, code):
            fail_count = await redis_client.incr(fail_key)
            await redis_client.expire(fail_key, 600)
            if fail_count >= PW_RESET_FAIL_LIMIT:
                await redis_client.delete(redis_key)
                await redis_client.delete(fail_key)
            raise BadRequestException(detail="인증 코드가 올바르지 않거나 만료되었습니다.")
        user = await User.get_or_none(email=email)
        if not user:
            raise BadRequestException(detail="인증 코드가 올바르지 않거나 만료되었습니다.")
        await redis_client.delete(fail_key)
        user.password_hash = hash_password(new_password)
        user.password_changed_at = datetime.now(UTC)
        await user.save()
        await redis_client.delete(redis_key)

    async def send_verification_code(self, email: str) -> None:
        await self.check_email_exists(email)
        cooldown_key = f"email_verify_cooldown:{email}"
        if await redis_client.get(cooldown_key):
            retry_after = await redis_client.ttl(cooldown_key)
            raise TooManyRequestsException(detail="잠시 후 다시 시도해주세요.", retry_after=retry_after)
        code = "".join(secrets.choice(string.digits) for _ in range(6))
        redis_key = f"email_verify:{email}"
        await redis_client.set(redis_key, code, ex=600)
        await redis_client.set(cooldown_key, "1", ex=PW_RESET_COOLDOWN_TTL)
        body = f"""
        <h2>MediPT 이메일 인증</h2>
        <p>아래 인증 코드를 입력해주세요. (10분 내 유효)</p>
        <h1 style="letter-spacing: 4px;">{code}</h1>
        <p>본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</p>
        """
        await send_email(to=email, subject="[MediPT] 이메일 인증 코드", body=body)

    async def verify_email_code(self, email: str, code: str) -> None:
        redis_key = f"email_verify:{email}"
        fail_key = f"email_verify_fail:{email}"
        stored_code = await redis_client.get(redis_key)
        if not stored_code or not hmac.compare_digest(stored_code, code):
            fail_count = await redis_client.incr(fail_key)
            await redis_client.expire(fail_key, 600)
            if fail_count >= EMAIL_VERIFY_FAIL_LIMIT:
                await redis_client.delete(redis_key)
                await redis_client.delete(fail_key)
            raise BadRequestException(detail="인증 코드가 올바르지 않거나 만료되었습니다.")
        await redis_client.delete(redis_key)
        await redis_client.delete(fail_key)

    async def check_email_exists(self, email: str | EmailStr) -> None:
        if await User.exists(email=email):
            raise DuplicateEmailException()

    async def revoke_all_tokens(self, user: User) -> int:
        """해당 유저의 모든 refresh token을 revoke한다. 전체 기기 로그아웃."""
        from datetime import UTC, datetime

        from app.models.auth_tokens import AuthToken

        count = await AuthToken.filter(user=user, revoked_at=None).count()
        await AuthToken.filter(user=user, revoked_at=None).update(revoked_at=datetime.now(UTC))
        return count
