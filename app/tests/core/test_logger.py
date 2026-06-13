from app.core.logger import mask_sensitive


class TestMaskSensitive:
    def test_mask_jwt_token(self):
        """JWT 토큰 마스킹 검증"""
        message = "Authorization: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature"
        assert "***TOKEN***" in mask_sensitive(message)

    def test_mask_email(self):
        """이메일 마스킹 검증"""
        message = "user@example.com 로그인 시도"
        assert "***EMAIL***" in mask_sensitive(message)

    def test_mask_password_field(self):
        """비밀번호 JSON 필드 마스킹 검증"""
        message = '{"email": "test@test.com", "password": "mypassword123"}'
        result = mask_sensitive(message)
        assert "mypassword123" not in result
        assert "***" in result

    def test_no_sensitive_data_unchanged(self):
        """민감정보 없는 메시지는 그대로 유지"""
        message = "서버 시작 완료"
        assert mask_sensitive(message) == message

    def test_multiple_sensitive_data(self):
        """여러 민감정보 동시 마스킹"""
        message = "email: test@test.com, token: eyJhbGciOiJIUzI1NiJ9.test.sig"
        result = mask_sensitive(message)
        assert "***EMAIL***" in result
        assert "***TOKEN***" in result
        assert "test@test.com" not in result
