from google.cloud import vision

from app.models.medical_records import MedicalRecord, RecordStatus
from app.models.ocr_lines import LineType, OcrLine
from app.models.processing_jobs import JobStatus, ProcessingJob


def _get_vision_client():
    return vision.ImageAnnotatorClient()


def _classify_line_type(text: str) -> LineType:
    """텍스트 내용으로 line_type 분류"""
    text_lower = text.lower()

    drug_keywords = ["mg", "정", "캡슐", "시럽", "주사", "크림", "연고"]
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

    return LineType.OTHER


async def process_ocr_job(job: ProcessingJob, image_data: bytes) -> bool:
    """
    GoogleVision OCR 처리 메인 함수
    1. Vision API 호출
    2. ocr_lines 저장
    3. MedicalRecord 상태 업데이트
    """
    await job.fetch_related("record")
    record = job.record
    await ProcessingJob.filter(id=job.id).update(status=JobStatus.PENDING)
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

        # MedicalRecord 업데이트
        avg_conf = sum(line["confidence"] for line in lines) / len(lines) if lines else 0
        await MedicalRecord.filter(id=record.id).update(
            ocr_text=full_text,
            ocr_confidence=round(avg_conf, 4),
            status=RecordStatus.OCR_COMPLETED,
        )
        await ProcessingJob.filter(id=job.id).update(status=JobStatus.COMPLETED)
        return True

    except Exception as e:
        await MedicalRecord.filter(id=record.id).update(status=RecordStatus.OCR_FAILED)
        await ProcessingJob.filter(id=job.id).update(
            status=JobStatus.FAILED,
            result_payload={"error": str(e)},
        )
        return False
