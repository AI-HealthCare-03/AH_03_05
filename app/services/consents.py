from datetime import UTC, datetime

from app.exceptions.common import BadRequestException
from app.models.user_consents import ConsentType, RequiredType, UserConsent
from app.models.users import User


class ConsentService:
    async def get_consents(self, user: User) -> list[UserConsent]:
        return await UserConsent.filter(user=user).order_by("consent_type")

    async def toggle_consent(self, user: User, consent_type: str, is_agreed: bool) -> UserConsent | None:
        try:
            consent_type_enum = ConsentType(consent_type)
        except ValueError:
            return None
        consent = await UserConsent.get_or_none(user=user, consent_type=consent_type_enum)
        if consent is None:
            return None
        if not is_agreed and consent.required_type == RequiredType.REQUIRED:
            raise BadRequestException(detail="필수 약관 철회는 회원탈퇴를 진행해주세요.")
        consent.is_agreed = is_agreed
        if is_agreed:
            consent.agreed_at = datetime.now(UTC)
            consent.revoked_at = None
        else:
            consent.revoked_at = datetime.now(UTC)
        await consent.save()
        return consent
