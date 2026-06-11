from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def get_access_token(client: AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "name": "테스터",
            "consents": CONSENTS,
        },
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "Password123!",
        },
    )
    return login_response.json()["access_token"]


class TestNotificationAPI(TestCase):
    async def test_get_notifications_empty(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify1@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.get("/api/v1/notifications", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["items"] == []
        assert response.json()["unread_count"] == 0

    async def test_get_notifications_unauthorized(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # When
            response = await client.get("/api/v1/notifications")

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_read_notification_not_found(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify2@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.patch("/api/v1/notifications/99999/read", headers=headers)

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_delete_notification_not_found(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify3@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.delete("/api/v1/notifications/99999", headers=headers)

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_unread_count(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify4@example.com")
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = await client.get("/api/v1/notifications/unread-count", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["unread_count"] == 0

    async def test_read_all_notifications_unauthorized(self):
        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # When
            response = await client.patch("/api/v1/notifications/read-all")
        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_read_all_notifications_success(self):
        from app.models.notifications import Notification
        from app.models.users import User

        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify5@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            user = await User.get(email="notify5@example.com")
            await Notification.create(
                user=user,
                notification_type="system",
                title="테스트 알림1",
                message="내용1",
                is_read=False,
            )
            await Notification.create(
                user=user,
                notification_type="system",
                title="테스트 알림2",
                message="내용2",
                is_read=False,
            )
            # When
            response = await client.patch("/api/v1/notifications/read-all", headers=headers)
        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["updated_count"] == 2

    async def test_read_notification_success(self):
        from app.models.notifications import Notification
        from app.models.users import User

        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify6@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            user = await User.get(email="notify6@example.com")
            notification = await Notification.create(
                user=user,
                notification_type="system",
                title="읽음테스트",
                message="내용",
                is_read=False,
            )
            # When
            response = await client.patch(
                f"/api/v1/notifications/{notification.id}/read",
                headers=headers,
            )
        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["is_read"] is True

    async def test_read_notification_already_read_preserves_read_at(self):
        from datetime import UTC, datetime

        from app.models.notifications import Notification
        from app.models.users import User

        # Given
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify7@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            user = await User.get(email="notify7@example.com")
            original_read_at = datetime(2026, 1, 1, tzinfo=UTC)
            notification = await Notification.create(
                user=user,
                notification_type="system",
                title="재읽음테스트",
                message="내용",
                is_read=True,
                read_at=original_read_at,
            )
            # When - 이미 읽은 알림 재읽음
            await client.patch(
                f"/api/v1/notifications/{notification.id}/read",
                headers=headers,
            )
            await notification.refresh_from_db()
        # Then - read_at이 보존되어야 함
        assert notification.read_at == original_read_at

    async def test_get_notifications_is_read_filter(self):
        # Given - 읽음/미읽음 알림 각 1개
        from app.models.notifications import Notification
        from app.models.users import User

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify_filter@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            user = await User.get(email="notify_filter@example.com")
            await Notification.create(user=user, notification_type="system", title="읽음", message="내용", is_read=True)
            await Notification.create(
                user=user, notification_type="system", title="미읽음", message="내용", is_read=False
            )
            # When - 미읽음만 필터
            response = await client.get("/api/v1/notifications?is_read=false", headers=headers)
        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["total"] == 1
        assert all(not item["is_read"] for item in response.json()["items"])

    async def test_get_notifications_pagination(self):
        # Given - size보다 많은 알림 생성 (5개)
        from app.models.notifications import Notification
        from app.models.users import User

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            token = await get_access_token(client, "notify_page@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            user = await User.get(email="notify_page@example.com")
            total_count = 5
            page_size = 2
            for i in range(total_count):
                await Notification.create(
                    user=user, notification_type="system", title=f"알림{i + 1}", message="내용", is_read=False
                )
            # When - size=2로 첫 페이지 요청
            response = await client.get(f"/api/v1/notifications?page=1&size={page_size}", headers=headers)
        # Then - items는 size만큼만, total은 전체 개수
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()["items"]) == page_size
        assert response.json()["total"] == total_count
        assert response.json()["page"] == 1
        assert response.json()["size"] == page_size
