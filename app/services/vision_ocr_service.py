import re
from datetime import UTC, datetime

from google.cloud import vision

from app.models.medical_records import MedicalRecord, RecordStatus
from app.models.medications import ApiStatus, InputMethod, Medication
from app.models.notifications import Notification, NotificationType
from app.models.ocr_lines import LineType, OcrLine
from app.models.processing_jobs import JobStatus, ProcessingJob
from app.services.fcm_service import send_ocr_completed_notification, send_ocr_failed_notification
from app.services.mfds_client import MFDSClient, map_mfds_response_to_drug_reference


def _get_vision_client():
    return vision.ImageAnnotatorClient()


def _classify_line_type(text: str) -> LineType:
    """텍스트 내용으로 line_type 분류"""
    text_lower = text.lower()

    # 처방전 헤더/메타 라인 우선 제외 (약품 오분류 방지)
    header_keywords = [
        "환자",
        "정보",
        "교부",
        "조제",
        "처방전",
        "일자",
        "번호",
        "성명",
        "주민",
        "보험",
        "병원",
        "의원",
        "약국",
        "의료기관",
        "면허",
        "발행",
        "수령",
        "대조",
    ]
    if any(k in text for k in header_keywords):
        return LineType.OTHER

    drug_keywords = ["mg", "캡슐", "시럽", "주사", "크림", "연고"]
    freq_keywords = ["1일", "하루", "매일", "아침", "저녁", "점심", "취침", "식후", "식전"]
    dosage_keywords = ["1정", "2정", "0.5정", "1캡슐", "ml", "cc"]
    caution_keywords = ["주의", "금기", "피하", "복용하지", "알레르기"]

    if any(k in text for k in freq_keywords):
        return LineType.FREQUENCY
    if any(k in text for k in dosage_keywords):
        return LineType.DOSAGE
    if any(k in text for k in caution_keywords):
        return LineType.CAUTION
    if any(k in text_lower for k in drug_keywords):
        return LineType.DRUG_NAME
    # "정"은 약품명 접미사(한글/영문 바로 뒤 "정")일 때만 인식
    if re.search(r"[가-힣A-Za-z]정(\s|$|\d)", text):
        return LineType.DRUG_NAME

    return LineType.OTHER


async def _notify_ocr_completed(job: ProcessingJob, record) -> None:
    """OCR 완료 알림 생성 (DB + FCM)"""
    await Notification.create(
        user=record.user,
        notification_type=NotificationType.OCR_COMPLETED,
        title="처방전 분석이 완료됐어요 ✅",
        message="약 정보를 확인하고 복약 가이드를 받아보세요!",
        related_job=job,
    )
    if record.user.fcm_token:
        await send_ocr_completed_notification(record.user.fcm_token)


async def _notify_ocr_failed(job: ProcessingJob, record) -> None:
    """OCR 실패 알림 생성 (DB + FCM)"""
    await Notification.create(
        user=record.user,
        notification_type=NotificationType.OCR_FAILED,
        title="처방전 분석에 실패했어요 ❌",
        message="다시 시도하거나 사진을 다시 촬영해주세요.",
        related_job=job,
    )
    if record.user.fcm_token:
        await send_ocr_failed_notification(record.user.fcm_token)


async def _create_medications_from_ocr(record, lines: list) -> None:
    """
    DRUG_NAME 라인 → 식약처 검색 → Medication 생성
    검색 성공 시 SEARCHED, 실패 시 신뢰도 높은 라인만 raw 저장
    """
    drug_lines = [line for line in lines if line["line_type"] == LineType.DRUG_NAME]
    if not drug_lines:
        return

    mfds = MFDSClient()
    for line in drug_lines:
        try:
            results = await mfds.search_drug(line["text"], num_of_rows=1)
            if results:
                item = map_mfds_response_to_drug_reference(results[0])
                await Medication.create(
                    user=record.user,
                    record=record,
                    drug_name=item["drug_name"],
                    ingredient_name=item.get("ingredient_name"),
                    manufacturer=item.get("manufacturer"),
                    dosage=item.get("dosage"),
                    caution=item.get("caution"),
                    side_effect=item.get("side_effect"),
                    input_method=InputMethod.OCR,
                    api_status=ApiStatus.SEARCHED,
                    ocr_confidence=line["confidence"],
                )
            elif line["confidence"] >= 0.85:
                # 검색 실패: 신뢰도 높은 라인만 raw 텍스트로 저장 (애매한 인식은 버림)
                await Medication.create(
                    user=record.user,
                    record=record,
                    drug_name=line["text"],
                    input_method=InputMethod.OCR,
                    api_status=ApiStatus.FAILED,
                    ocr_confidence=line["confidence"],
                )
        except Exception:
            # 예외 발생 시에도 신뢰도 높은 라인만 raw 저장
            if line["confidence"] >= 0.85:
                await Medication.create(
                    user=record.user,
                    record=record,
                    drug_name=line["text"],
                    input_method=InputMethod.OCR,
                    api_status=ApiStatus.FAILED,
                    ocr_confidence=line["confidence"],
                )


async def process_ocr_job(job: ProcessingJob, image_data: bytes) -> bool:
    """
    GoogleVision OCR 처리 메인 함수
    1. Vision API 호출
    2. ocr_lines 저장
    3. DRUG_NAME 라인 → 식약처 검색 → Medication 생성
    4. MedicalRecord 상태 업데이트
    5. 알림 생성 (DB + FCM)
    """
    await job.fetch_related("record")
    record = job.record
    await record.fetch_related("user")
    await ProcessingJob.filter(id=job.id).update(
        status=JobStatus.RUNNING,
        started_at=datetime.now(UTC),
        progress=0,
    )
    await MedicalRecord.filter(id=record.id).update(status=RecordStatus.OCR_PENDING)

    try:
        client = _get_vision_client()
        image = vision.Image(content=image_data)
        response = client.document_text_detection(image=image)

        if response.error.message:
            raise Exception(response.error.message)

        full_text = response.full_text_annotation.text
        pages = response.full_text_annotation.pages

        lines = []
        line_number = 0
        for page in pages:
            for block in page.blocks:
                for paragraph in block.paragraphs:
                    line_texts = []
                    confidences = []
                    for word in paragraph.words:
                        word_text = "".join([s.text for s in word.symbols])
                        line_texts.append(word_text)
                        confidences.append(word.confidence)

                    line_text = " ".join(line_texts)
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0

                    if line_text.strip():
                        lines.append(
                            {
                                "line_number": line_number,
                                "text": line_text.strip(),
                                "confidence": round(avg_confidence, 4),
                                "line_type": _classify_line_type(line_text),
                            }
                        )
                        line_number += 1

        # ocr_lines 저장
        for line in lines:
            await OcrLine.create(
                medical_record=record,
                line_number=line["line_number"],
                text=line["text"],
                confidence=line["confidence"],
                line_type=line["line_type"],
            )

        # DRUG_NAME 라인 → 식약처 검색 → Medication 생성
        await _create_medications_from_ocr(record, lines)

        # MedicalRecord 업데이트
        avg_conf = sum(line["confidence"] for line in lines) / len(lines) if lines else 0
        await MedicalRecord.filter(id=record.id).update(
            ocr_text=full_text,
            ocr_confidence=round(avg_conf, 4),
            status=RecordStatus.OCR_COMPLETED,
        )
        await ProcessingJob.filter(id=job.id).update(
            status=JobStatus.COMPLETED,
            completed_at=datetime.now(UTC),
            progress=100,
            result_ref=str(record.id),
        )
        await _notify_ocr_completed(job, record)
        return True

    except Exception as e:
        await MedicalRecord.filter(id=record.id).update(status=RecordStatus.OCR_FAILED)
        await ProcessingJob.filter(id=job.id).update(
            status=JobStatus.FAILED,
            result_payload={"error": str(e)},
            completed_at=datetime.now(UTC),
            progress=0,
        )
        await _notify_ocr_failed(job, record)
        return False
