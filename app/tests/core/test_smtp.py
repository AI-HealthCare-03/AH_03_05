from unittest.mock import AsyncMock, patch
from tortoise.contrib.test import TestCase


class TestSendEmail(TestCase):
    async def test_send_email_success(self):
        """send_email이 aiosmtplib.send를 올바른 인자로 호출한다."""
        with patch("app.core.smtp.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            from app.core.smtp import send_email
            await send_email(
                to="test@example.com",
                subject="테스트 제목",
                body="<p>테스트 본문</p>",
            )
            assert mock_send.called
            kwargs = mock_send.call_args.kwargs
            assert kwargs["hostname"] is not None
            assert kwargs["port"] is not None
            assert kwargs["start_tls"] is True

    async def test_send_email_sets_headers(self):
        """send_email이 수신자·제목·발신자 헤더를 올바르게 설정한다."""
        with patch("app.core.smtp.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            from app.core.smtp import send_email
            await send_email(
                to="recipient@example.com",
                subject="헤더 테스트",
                body="<p>본문</p>",
            )
            message = mock_send.call_args.args[0]
            assert message["To"] == "recipient@example.com"
            assert message["Subject"] == "헤더 테스트"
