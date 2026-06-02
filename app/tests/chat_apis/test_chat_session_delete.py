from httpx import ASGITransport, AsyncClient
from starlette import status
from tortoise.contrib.test import TestCase

from app.main import app
from app.models.chat_sessions import ChatSession, ChatSessionStatus
from app.models.users import User

CONSENTS = [
    {"consent_type": "terms", "is_agreed": True},
    {"consent_type": "privacy", "is_agreed": True},
    {"consent_type": "sensitive_health", "is_agreed": True},
    {"consent_type": "ai_analysis", "is_agreed": True},
]


class TestChatSessionDeleteAPI(TestCase):
    async def get_auth_headers(self, client: AsyncClient, email: str, name: str) -> dict:
        signup_data = {"email": email, "password": "Password123!", "name": name, "consents": CONSENTS}
        await client.post("/api/v1/auth/signup", json=signup_data)
        login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        return {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    async def test_delete_session_success(self):
        """본인 소유의 채팅 세션 삭제 성공 -> 상태가 DELETED로 변경되는지 검증 (204)"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await self.get_auth_headers(client, "chat_del@test.com", "삭제테스터")
            user = await User.get(email="chat_del@test.com")

            # 테스트용 세션 생성 (초기 상태 ACTIVE)
            session = await ChatSession.create(user=user, title="테스트 채팅방", status=ChatSessionStatus.ACTIVE)

            # DELETE 요청 전송
            response = await client.delete(f"/api/v1/chat/sessions/{session.id}", headers=headers)
            assert response.status_code == status.HTTP_204_NO_CONTENT

            # DB 상태가 DELETED로 변경되었는지 확인
            updated_session = await ChatSession.get(id=session.id)
            assert updated_session.status == ChatSessionStatus.DELETED

    async def test_delete_session_not_found(self):
        """존재하지 않거나 남의 채팅 세션 삭제 시도 시 실패 (404)"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = await self.get_auth_headers(client, "chat_other@test.com", "타인테스터")

            # 존재하지 않는 ID로 DELETE 요청
            response = await client.delete("/api/v1/chat/sessions/99999", headers=headers)
            assert response.status_code == status.HTTP_404_NOT_FOUND
