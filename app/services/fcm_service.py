import os

import firebase_admin
from firebase_admin import credentials, messaging

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is None:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            _firebase_app = firebase_admin.initialize_app()
    return _firebase_app


async def send_push_notification(
    fcm_token: str,
    title: str,
    body: str,
    data: dict | None = None,
) -> bool:
    """FCM 푸시 알림 발송"""
    try:
        _get_firebase_app()
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=fcm_token,
        )
        messaging.send(message)
        return True
    except Exception as e:
        print(f"FCM 발송 실패: {e}")
        return False


async def send_guide_completed_notification(fcm_token: str) -> bool:
    """가이드 생성 완료 알림"""
    return await send_push_notification(
        fcm_token=fcm_token,
        title="복약 가이드가 완성됐어요 💊",
        body="맞춤 복약 안내와 생활습관 가이드를 확인해보세요!",
    )


async def send_ocr_completed_notification(fcm_token: str) -> bool:
    """OCR 처리 완료 알림"""
    return await send_push_notification(
        fcm_token=fcm_token,
        title="처방전 분석이 완료됐어요 ✅",
        body="약 정보를 확인하고 복약 가이드를 받아보세요!",
    )


async def send_ocr_failed_notification(fcm_token: str) -> bool:
    """OCR 처리 실패 알림"""
    return await send_push_notification(
        fcm_token=fcm_token,
        title="처방전 분석에 실패했어요 ❌",
        body="다시 시도하거나 사진을 다시 촬영해주세요.",
    )
