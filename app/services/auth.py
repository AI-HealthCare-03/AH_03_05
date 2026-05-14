from fastapi.exceptions import HTTPException
from pydantic import EmailStr
from starlette import status
from tortoise.transactions import in_transaction

from app.dtos.auth import LoginRequest, SignUpRequest
from app.models.users import User, UserStatus
from app.models.user_consents import UserConsent, ConsentType, RequiredType
from app.models.auth_tokens import AuthToken
from app.core.jwt.tokens import AccessToken, RefreshToken
from app.core.utils.security import hash_password, verify_password
from app.services.jwt import JwtService


class AuthService:
    def __init__(self):
        self.jwt_service = JwtService()

    async def signup(self, data: SignUpRequest) -> User:
        # 이메일 중복 체크
        await self.check_email_exists(data.email)

        # 필수 동의 항목 검증
        required_types = {
            ConsentType.TERMS,
            ConsentType.PRIVACY,
            ConsentType.SENSITIVE_HEALTH,
            ConsentType.AI_ANALYSIS,
        }
        agreed_types = {
            ConsentType(c.consent_type)
            for c in data.consents
            if c.is_agreed
        }
        if not required_types.issubset(agreed_types):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="필수 약관에 모두 동의해주세요."
            )

        async with in_transaction():
            # 유저 생성
            user = await User.create(
                email=data.email,
                password_hash=hash_password(data.password),
                name=data.name,
                nickname=data.nickname,
                status=UserStatus.ACTIVE,
            )

            # 동의 항목 저장
            for consent in data.consents:
                consent_type = ConsentType(consent.consent_type)
                required_type = (
                    RequiredType.REQUIRED
                    if consent_type in required_types
                    else RequiredType.OPTIONAL
                )
                await UserConsent.create(
                    user=user,
                    consent_type=consent_type,
                    required_type=required_type,
                    is_agreed=consent.is_agreed,
                )

            return user

    async def authenticate(self, data: LoginRequest) -> User:
        email = str(data.email)
        user = await User.get_or_none(email=email)

        # 통합 메시지 (계정 존재 여부 노출 방지)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="계정 또는 비밀번호가 일치하지 않습니다."
            )

        # 탈퇴 계정 체크
        if user.status == UserStatus.WITHDRAWN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="탈퇴한 계정입니다."
            )

        return user

    async def login(self, user: User) -> dict[str, AccessToken | RefreshToken]:
        # 마지막 로그인 시각 업데이트
        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        await user.save()

        return self.jwt_service.issue_jwt_pair(user)

    async def logout(self, refresh_token: str) -> None:
        token = await AuthToken.get_or_none(refresh_token=refresh_token)
        if token:
            from datetime import datetime, timezone
            token.revoked_at = datetime.now(timezone.utc)
            await token.save()

    async def check_email_exists(self, email: str | EmailStr) -> None:
        if await User.exists(email=email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 사용중인 이메일입니다."
            )
