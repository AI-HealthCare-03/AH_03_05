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


class TestUserMeApis(TestCase):
    async def test_get_user_me_success(self):
        # Given
        email = "me@example.com"
        signup_data = {
            "email": email,
            "password": "Password123!",
            "name": "내정보테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.get("/api/v1/users/me", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["email"] == email
        assert response.json()["name"] == "내정보테스터"

    async def test_update_user_me_success(self):
        # Given
        email = "update_me@example.com"
        signup_data = {
            "email": email,
            "password": "Password123!",
            "name": "수정전",
            "consents": CONSENTS,
        }
        update_data = {"nickname": "수정후닉네임"}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.patch("/api/v1/users/me", json=update_data, headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["nickname"] == "수정후닉네임"

    async def test_get_user_me_unauthorized(self):
        # Given & When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/users/me")

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_change_password_success(self):
        # Given
        email = "change_pw@example.com"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "비번변경테스터",
                    "consents": CONSENTS,
                },
            )
            login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.patch(
                "/api/v1/users/me/password",
                headers=headers,
                json={"current_password": "Password123!", "new_password": "NewPassword123!"},
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "비밀번호가 변경되었습니다."

    async def test_change_password_wrong_current(self):
        # Given
        email = "change_pw2@example.com"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "비번변경테스터2",
                    "consents": CONSENTS,
                },
            )
            login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.patch(
                "/api/v1/users/me/password",
                headers=headers,
                json={"current_password": "WrongPassword123!", "new_password": "NewPassword123!"},
            )

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_withdraw_user_success(self):
        # Given
        email = "withdraw@example.com"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "탈퇴테스터",
                    "consents": CONSENTS,
                },
            )
            login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.request(
                "DELETE",
                "/api/v1/users/me",
                headers={**headers, "Content-Type": "application/json"},
                content=b'{"password": "Password123!"}',
            )

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "회원탈퇴가 완료되었습니다."

    async def test_withdraw_user_wrong_password(self):
        # Given
        email = "withdraw2@example.com"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/v1/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "name": "탈퇴테스터2",
                    "consents": CONSENTS,
                },
            )
            login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.request(
                "DELETE",
                "/api/v1/users/me",
                headers={**headers, "Content-Type": "application/json"},
                content=b'{"password": "WrongPassword123!"}',
            )

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST
