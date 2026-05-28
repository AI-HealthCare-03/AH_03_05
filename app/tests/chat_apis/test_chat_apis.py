from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.chat_messages import ChatMessage
from app.models.medical_records import (
    InputMethod,
    MedicalRecord,
    RecordStatus,
    RecordType,
)
from app.models.users import User

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
    {"consent_type": "marketing", "is_agreed": False},
]


async def _signup_and_login(client: AsyncClient, email: str) -> dict[str, str]:
    """회원가입 + 로그인 후 Bearer 헤더 반환."""
    await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "name": "챗봇테스터",
            "consents": CONSENTS,
        },
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


async def _create_record(user_email: str) -> MedicalRecord:
    """테스트용 record 직접 생성."""
    user = await User.get(email=user_email)
    return await MedicalRecord.create(
        user=user,
        record_type=RecordType.PRESCRIPTION,
        status=RecordStatus.OCR_COMPLETED,
        input_method=InputMethod.UPLOAD,
    )


class TestChatSessionAPI(TestCase):
    async def test_create_session_without_auth_returns_401(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": 1},
            )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_create_session_other_user_record_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await _signup_and_login(client, "chat_a@example.com")
            record_a = await _create_record("chat_a@example.com")

            headers_b = await _signup_and_login(client, "chat_b@example.com")
            response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": record_a.id},
                headers=headers_b,
            )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_create_session_success_returns_201(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "chat_ok@example.com")
            record = await _create_record("chat_ok@example.com")

            response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": record.id},
                headers=headers,
            )

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert body["record_id"] == record.id
        assert body["status"] == "ACTIVE"
        assert body["session_id"] is not None


class TestChatMessageAPI(TestCase):
    async def test_send_message_without_auth_returns_401(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/chat/sessions/1/messages",
                json={"message": "테스트"},
            )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_send_message_other_user_session_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # user A가 세션 생성
            headers_a = await _signup_and_login(client, "msg_a@example.com")
            record_a = await _create_record("msg_a@example.com")
            create_response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": record_a.id},
                headers=headers_a,
            )
            session_id = create_response.json()["session_id"]

            # user B가 user A의 세션으로 메시지 시도
            headers_b = await _signup_and_login(client, "msg_b@example.com")
            response = await client.post(
                f"/api/v1/chat/sessions/{session_id}/messages",
                json={"message": "남의 세션에 침입"},
                headers=headers_b,
            )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_send_message_success_returns_200(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "msg_ok@example.com")
            record = await _create_record("msg_ok@example.com")

            create_response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": record.id},
                headers=headers,
            )
            session_id = create_response.json()["session_id"]

            response = await client.post(
                f"/api/v1/chat/sessions/{session_id}/messages",
                json={"message": "약을 언제 먹어야 하나요?"},
                headers=headers,
            )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["session_id"] == session_id
        assert body["user_message"] == "약을 언제 먹어야 하나요?"
        assert body["assistant_message"]  # 비어있지 않음
        assert "safety_flag" in body

        # DB에 메시지 2개 저장됐는지 확인 (user + assistant)
        messages = await ChatMessage.filter(session_id=session_id).all()
        assert len(messages) == 2


class TestChatSessionListAPI(TestCase):
    async def test_list_sessions_without_auth_returns_401(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/chat/sessions")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_list_sessions_empty_returns_200(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "list_empty@example.com")
            response = await client.get("/api/v1/chat/sessions", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["items"] == []
        assert body["total"] == 0

    async def test_list_sessions_success_returns_200(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "list_ok@example.com")
            record = await _create_record("list_ok@example.com")

            session_ids = []
            for _ in range(3):
                create_response = await client.post(
                    "/api/v1/chat/sessions",
                    json={"record_id": record.id},
                    headers=headers,
                )
                session_ids.append(create_response.json()["session_id"])

            response = await client.get("/api/v1/chat/sessions", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["total"] == 3
        assert len(body["items"]) == 3
        # updated_at 최신순 검증: 마지막 생성 세션이 첫번째
        assert body["items"][0]["session_id"] == session_ids[-1]
        assert body["items"][2]["session_id"] == session_ids[0]

    async def test_list_sessions_only_own_sessions(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # user A가 세션 2개 생성
            headers_a = await _signup_and_login(client, "iso_a@example.com")
            record_a = await _create_record("iso_a@example.com")
            for _ in range(2):
                await client.post(
                    "/api/v1/chat/sessions",
                    json={"record_id": record_a.id},
                    headers=headers_a,
                )

            # user B는 본인 세션 0개
            headers_b = await _signup_and_login(client, "iso_b@example.com")
            response = await client.get("/api/v1/chat/sessions", headers=headers_b)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["total"] == 0
        assert body["items"] == []


class TestChatMessageListAPI(TestCase):
    async def test_list_messages_without_auth_returns_401(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/chat/sessions/1/messages")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_list_messages_not_found_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "msg_404@example.com")
            response = await client.get("/api/v1/chat/sessions/999999/messages", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_list_messages_other_user_session_returns_404(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # user A가 세션 생성
            headers_a = await _signup_and_login(client, "msg_iso_a@example.com")
            record_a = await _create_record("msg_iso_a@example.com")
            create_response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": record_a.id},
                headers=headers_a,
            )
            session_id = create_response.json()["session_id"]

            # user B가 user A 세션 메시지 시도
            headers_b = await _signup_and_login(client, "msg_iso_b@example.com")
            response = await client.get(
                f"/api/v1/chat/sessions/{session_id}/messages",
                headers=headers_b,
            )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_list_messages_success_returns_200(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await _signup_and_login(client, "msg_list@example.com")
            record = await _create_record("msg_list@example.com")

            create_response = await client.post(
                "/api/v1/chat/sessions",
                json={"record_id": record.id},
                headers=headers,
            )
            session_id = create_response.json()["session_id"]

            # 메시지 2번 전송 (각각 user + assistant 저장 -> 총 4개)
            for msg in ["첫번째 질문", "두번째 질문"]:
                await client.post(
                    f"/api/v1/chat/sessions/{session_id}/messages",
                    json={"message": msg},
                    headers=headers,
                )

            response = await client.get(
                f"/api/v1/chat/sessions/{session_id}/messages",
                headers=headers,
            )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["session_id"] == session_id
        assert body["total"] == 4
        assert len(body["items"]) == 4
        # created_at 오름차순 검증
        assert body["items"][0]["sender_type"] == "USER"
        assert body["items"][0]["content"] == "첫번째 질문"
        assert body["items"][1]["sender_type"] == "ASSISTANT"
        assert body["items"][2]["sender_type"] == "USER"
        assert body["items"][2]["content"] == "두번째 질문"
