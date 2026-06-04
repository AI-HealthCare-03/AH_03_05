from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.guides import Guide
from app.models.users import User

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def _signup_and_login(client: AsyncClient, email: str) -> dict[str, str]:
    signup_data = {
        "email": email,
        "password": "Password123!",
        "name": "피드백테스터",
        "consents": CONSENTS,
    }
    await client.post("/api/v1/auth/signup", json=signup_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


class TestFeedbackAPI(TestCase):
    async def test_create_feedback_with_guide_success(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "fb_guide@example.com")
            user = await User.get(email="fb_guide@example.com")
            guide = await Guide.create(user=user)

            response = await client.post(
                "/api/v1/feedbacks",
                json={"guide_id": guide.id, "rating": 5, "comment": "도움이 됐어요"},
                headers=headers,
            )

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert body["id"] is not None
        assert body["guide_id"] == guide.id
        assert body["rating"] == 5

    async def test_create_feedback_without_target_returns_422(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "fb_notarget@example.com")
            response = await client.post("/api/v1/feedbacks", json={"rating": 3}, headers=headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_create_feedback_with_unknown_guide_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "fb_unknown@example.com")
            response = await client.post("/api/v1/feedbacks", json={"guide_id": 99999999}, headers=headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_create_feedback_unauthorized(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/feedbacks", json={"guide_id": 1})

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


class TestFeedbackSummaryAPI(TestCase):
    async def test_summary_empty(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "fb_sum_empty@example.com")
            response = await client.get("/api/v1/feedbacks/summary", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["total_count"] == 0
        assert body["average_rating"] is None
        assert body["low_rated_items"] == []
        assert body["rating_distribution"] == {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}

    async def test_summary_aggregates_ratings(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "fb_sum_agg@example.com")
            user = await User.get(email="fb_sum_agg@example.com")
            guide = await Guide.create(user=user)
            # 평점 5, 4, 1 등록 (1점은 개선 필요 대상)
            for rating in (5, 4, 1):
                await client.post(
                    "/api/v1/feedbacks",
                    json={"guide_id": guide.id, "rating": rating},
                    headers=headers,
                )
            response = await client.get("/api/v1/feedbacks/summary", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["total_count"] == 3
        assert body["rating_distribution"]["5"] == 1
        assert body["rating_distribution"]["4"] == 1
        assert body["rating_distribution"]["1"] == 1
        assert body["average_rating"] == round((5 + 4 + 1) / 3, 2)
        # 1~2점은 개선 필요 목록에 포함
        assert len(body["low_rated_items"]) == 1
        assert body["low_rated_items"][0]["rating"] == 1

    async def test_summary_counts_reports(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "fb_sum_report@example.com")
            user = await User.get(email="fb_sum_report@example.com")
            guide = await Guide.create(user=user)
            await client.post(
                "/api/v1/feedbacks",
                json={"guide_id": guide.id, "report_type": "inaccurate", "is_safety_report": True},
                headers=headers,
            )
            response = await client.get("/api/v1/feedbacks/summary", headers=headers)

        body = response.json()
        assert body["report_count"] == 1
        assert body["safety_report_count"] == 1

    async def test_summary_unauthorized(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/feedbacks/summary")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
