from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture
def mock_job():
    job = MagicMock()
    job.id = 1
    job.fetch_related = AsyncMock()
    record = MagicMock()
    record.id = 1
    record.fetch_related = AsyncMock()
    user = MagicMock()
    user.fcm_token = None
    record.user = user
    job.record = record
    return job


class TestProcessOcrJob:
    """process_ocr_job 함수 테스트"""

    @pytest.mark.asyncio
    async def test_ocr_success(self, mock_job):
        mock_response = MagicMock()
        mock_response.error.message = ""
        mock_response.full_text_annotation.text = "타이레놀 500mg 1일 3회"
        mock_word = MagicMock()
        mock_word.symbols = [MagicMock(text="타이레놀")]
        mock_word.confidence = 0.95
        mock_paragraph = MagicMock()
        mock_paragraph.words = [mock_word]
        mock_block = MagicMock()
        mock_block.paragraphs = [mock_paragraph]
        mock_page = MagicMock()
        mock_page.blocks = [mock_block]
        mock_response.full_text_annotation.pages = [mock_page]

        with patch("app.services.vision_ocr_service._get_vision_client") as mock_client:
            with patch("app.services.vision_ocr_service.ProcessingJob") as mock_pj:
                with patch("app.services.vision_ocr_service.MedicalRecord") as mock_mr:
                    with patch("app.services.vision_ocr_service.OcrLine") as mock_ocr:
                        with patch(
                            "app.services.vision_ocr_service._notify_ocr_completed",
                            new_callable=AsyncMock,
                        ):
                            mock_client.return_value.document_text_detection.return_value = mock_response
                            mock_pj.filter.return_value.update = AsyncMock()
                            mock_mr.filter.return_value.update = AsyncMock()
                            mock_ocr.create = AsyncMock()

                            from app.services.vision_ocr_service import process_ocr_job

                            result = await process_ocr_job(mock_job, b"fake_image_data")

                            assert result is True

    @pytest.mark.asyncio
    async def test_ocr_failure(self, mock_job):
        with patch("app.services.vision_ocr_service._get_vision_client") as mock_client:
            with patch("app.services.vision_ocr_service.ProcessingJob") as mock_pj:
                with patch("app.services.vision_ocr_service.MedicalRecord") as mock_mr:
                    with patch(
                        "app.services.vision_ocr_service._notify_ocr_failed",
                        new_callable=AsyncMock,
                    ):
                        mock_client.return_value.document_text_detection.side_effect = Exception("API Error")
                        mock_pj.filter.return_value.update = AsyncMock()
                        mock_mr.filter.return_value.update = AsyncMock()

                        from app.services.vision_ocr_service import process_ocr_job

                        result = await process_ocr_job(mock_job, b"fake_image_data")

                        assert result is False


class TestClassifyLineType:
    """_classify_line_type 함수 테스트"""

    def test_frequency_keyword(self):
        from app.models.ocr_lines import LineType
        from app.services.vision_ocr_service import _classify_line_type

        assert _classify_line_type("1일 3회 복용") == LineType.FREQUENCY

    def test_drug_name_keyword(self):
        from app.models.ocr_lines import LineType
        from app.services.vision_ocr_service import _classify_line_type

        assert _classify_line_type("타이레놀 500mg") == LineType.DRUG_NAME

    def test_caution_keyword(self):
        from app.models.ocr_lines import LineType
        from app.services.vision_ocr_service import _classify_line_type

        assert _classify_line_type("복용하지 마세요") == LineType.CAUTION

    def test_other_keyword(self):
        from app.models.ocr_lines import LineType
        from app.services.vision_ocr_service import _classify_line_type

        assert _classify_line_type("기타 내용") == LineType.OTHER


class TestFcmService:
    """fcm_service 함수 테스트"""

    @pytest.mark.asyncio
    async def test_send_push_notification_success(self):
        with patch("app.services.fcm_service._get_firebase_app"):
            with patch("app.services.fcm_service.messaging") as mock_messaging:
                mock_messaging.Message.return_value = MagicMock()
                mock_messaging.Notification.return_value = MagicMock()
                mock_messaging.send.return_value = "message_id"

                from app.services.fcm_service import send_push_notification

                result = await send_push_notification("token", "title", "body")
                assert result is True

    @pytest.mark.asyncio
    async def test_send_push_notification_failure(self):
        with patch("app.services.fcm_service._get_firebase_app"):
            with patch("app.services.fcm_service.messaging") as mock_messaging:
                mock_messaging.send.side_effect = Exception("FCM Error")

                from app.services.fcm_service import send_push_notification

                result = await send_push_notification("token", "title", "body")
                assert result is False

    @pytest.mark.asyncio
    async def test_send_guide_completed_notification(self):
        with patch("app.services.fcm_service.send_push_notification", AsyncMock(return_value=True)):
            from app.services.fcm_service import send_guide_completed_notification

            result = await send_guide_completed_notification("token")
            assert result is True

    @pytest.mark.asyncio
    async def test_send_ocr_completed_notification(self):
        with patch("app.services.fcm_service.send_push_notification", AsyncMock(return_value=True)):
            from app.services.fcm_service import send_ocr_completed_notification

            result = await send_ocr_completed_notification("token")
            assert result is True

    @pytest.mark.asyncio
    async def test_send_ocr_failed_notification(self):
        with patch("app.services.fcm_service.send_push_notification", AsyncMock(return_value=True)):
            from app.services.fcm_service import send_ocr_failed_notification

            result = await send_ocr_failed_notification("token")
            assert result is True


class TestNotifyOcrHooks:
    """_notify_ocr_completed, _notify_ocr_failed 함수 테스트"""

    @pytest.mark.asyncio
    async def test_notify_ocr_completed_without_fcm(self):
        """FCM 토큰 없을 때 DB 알림만 생성"""
        mock_job = MagicMock()
        mock_job.id = 1
        mock_record = MagicMock()
        mock_record.user.fcm_token = None

        with patch("app.services.vision_ocr_service.Notification") as mock_noti:
            mock_noti.create = AsyncMock()
            from app.services.vision_ocr_service import _notify_ocr_completed

            await _notify_ocr_completed(mock_job, mock_record)
            mock_noti.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_notify_ocr_completed_with_fcm(self):
        """FCM 토큰 있을 때 DB 알림 + FCM 푸시"""
        mock_job = MagicMock()
        mock_job.id = 1
        mock_record = MagicMock()
        mock_record.user.fcm_token = "test_token"

        with patch("app.services.vision_ocr_service.Notification") as mock_noti:
            with patch(
                "app.services.vision_ocr_service.send_ocr_completed_notification", AsyncMock(return_value=True)
            ) as mock_fcm:
                mock_noti.create = AsyncMock()
                from app.services.vision_ocr_service import _notify_ocr_completed

                await _notify_ocr_completed(mock_job, mock_record)
                mock_noti.create.assert_called_once()
                mock_fcm.assert_called_once_with("test_token")

    @pytest.mark.asyncio
    async def test_notify_ocr_failed_without_fcm(self):
        """FCM 토큰 없을 때 DB 알림만 생성"""
        mock_job = MagicMock()
        mock_job.id = 1
        mock_record = MagicMock()
        mock_record.user.fcm_token = None

        with patch("app.services.vision_ocr_service.Notification") as mock_noti:
            mock_noti.create = AsyncMock()
            from app.services.vision_ocr_service import _notify_ocr_failed

            await _notify_ocr_failed(mock_job, mock_record)
            mock_noti.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_notify_ocr_failed_with_fcm(self):
        """FCM 토큰 있을 때 DB 알림 + FCM 푸시"""
        mock_job = MagicMock()
        mock_job.id = 1
        mock_record = MagicMock()
        mock_record.user.fcm_token = "test_token"

        with patch("app.services.vision_ocr_service.Notification") as mock_noti:
            with patch(
                "app.services.vision_ocr_service.send_ocr_failed_notification", AsyncMock(return_value=True)
            ) as mock_fcm:
                mock_noti.create = AsyncMock()
                from app.services.vision_ocr_service import _notify_ocr_failed

                await _notify_ocr_failed(mock_job, mock_record)
                mock_noti.create.assert_called_once()
                mock_fcm.assert_called_once_with("test_token")
