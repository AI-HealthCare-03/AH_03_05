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

HEALTH_PROFILE_DATA = {
    "age_group": "30s",
    "gender": "M",
    "chronic_diseases": ["hypertension"],
    "allergies": ["penicillin"],
    "current_medications": ["metformin"],
    "medical_history": "고혈압 진단",
    "doctor_opinion": "식후 복용 권장",
}


class TestHealthProfileAPI(TestCase):
    async def test_upsert_health_profile_success(self):
        # Given
        signup_data = {
            "email": "health@example.com",
            "password": "Password123!",
            "name": "건강테스터",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "health@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.put("/api/v1/health-profile", json=HEALTH_PROFILE_DATA, headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["profile_id"] is not None
        assert response.json()["updated_at"] is not None

    async def test_get_health_profile_success(self):
        # Given
        signup_data = {
            "email": "health2@example.com",
            "password": "Password123!",
            "name": "건강테스터2",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "health2@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            await client.put("/api/v1/health-profile", json=HEALTH_PROFILE_DATA, headers=headers)

            # When
            response = await client.get("/api/v1/health-profile", headers=headers)

        # Then
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["profile_id"] is not None
        assert response.json()["chronic_diseases"] == ["hypertension"]
        assert response.json()["gender"] == "M"
        assert response.json()["medical_history"] == "고혈압 진단"
        assert response.json()["doctor_opinion"] == "식후 복용 권장"

    async def test_get_health_profile_not_found(self):
        # Given
        signup_data = {
            "email": "health3@example.com",
            "password": "Password123!",
            "name": "건강테스터3",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "health3@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # When
            response = await client.get("/api/v1/health-profile", headers=headers)

        # Then
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_health_profile_unauthorized(self):
        # Given & When
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/health-profile")

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_upsert_health_profile_update_existing(self):
        """이미 프로필이 있을 때 PUT으로 업데이트하는 분기 검증 (services/health_profiles.py 18-20)"""
        signup_data = {
            "email": "health4@example.com",
            "password": "Password123!",
            "name": "건강테스터4",
            "consents": CONSENTS,
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post("/api/v1/auth/signup", json=signup_data)
            login_response = await client.post(
                "/api/v1/auth/login",
                json={"email": "health4@example.com", "password": "Password123!"},
            )
            access_token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # 1차 PUT (create 분기)
            first_response = await client.put("/api/v1/health-profile", json=HEALTH_PROFILE_DATA, headers=headers)
            first_profile_id = first_response.json()["profile_id"]

            # 2차 PUT (update 분기)
            updated_data = {
                "age_group": "40s",
                "gender": "M",
                "chronic_diseases": ["diabetes"],
                "allergies": [],
                "current_medications": ["insulin"],
                "medical_history": "당뇨 진단으로 변경",
                "doctor_opinion": "식전 인슐린",
            }
            response = await client.put("/api/v1/health-profile", json=updated_data, headers=headers)

            assert response.status_code == status.HTTP_200_OK
            # 같은 profile_id = update 분기 탔다는 증거 (create면 새 id)
            assert response.json()["profile_id"] == first_profile_id

            # 변경 사항 검증 (같은 client 안에서)
            get_response = await client.get("/api/v1/health-profile", headers=headers)
            assert get_response.json()["chronic_diseases"] == ["diabetes"]
