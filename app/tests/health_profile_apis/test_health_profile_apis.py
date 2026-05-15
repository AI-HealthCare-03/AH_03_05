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
            response = await client.put("/api/v1/health-profile", json=HEALTH_PROFILE_DATA, headers=headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["profile_id"] is not None
        assert response.json()["age_group"] == "30s"
        assert response.json()["chronic_diseases"] == ["hypertension"]

    async def test_get_health_profile_success(self):
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
            response = await client.get("/api/v1/health-profile", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["profile_id"] is not None
        assert response.json()["chronic_diseases"] == ["hypertension"]

    async def test_get_health_profile_not_found(self):
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
            response = await client.get("/api/v1/health-profile", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_health_profile_unauthorized(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/health-profile")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
