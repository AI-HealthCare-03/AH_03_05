from app.dtos.health_profiles import HealthProfileUpdateRequest
from app.models.user_health_profiles import UserHealthProfile
from app.models.users import User


class HealthProfileService:
    async def get_health_profile(self, user: User) -> UserHealthProfile | None:
        return await UserHealthProfile.get_or_none(user=user)

    async def upsert_health_profile(self, user: User, data: HealthProfileUpdateRequest) -> UserHealthProfile:
        profile = await UserHealthProfile.get_or_none(user=user)
        if profile is None:
            profile = await UserHealthProfile.create(
                user=user,
                **data.model_dump(exclude_none=True),
            )
        else:
            for key, value in data.model_dump(exclude_none=True).items():
                setattr(profile, key, value)
            await profile.save()
        return profile
