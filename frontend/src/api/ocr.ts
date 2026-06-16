import { apiClient } from './client';
import type { OcrJobResponse } from './types';
import type { UploadFile } from './records';

// OCR 잡 생성 — 이미지를 요청에 직접 첨부한다(POST /ocr/jobs/upload).
// BE는 이 경로에서만 OCR 처리(process_ocr_job)를 트리거한다. record_id만 보내는
// JSON 경로(POST /ocr/jobs)는 처리기가 연결돼 있지 않아 job이 영원히 pending이다.
export async function createOcrJobWithFile(
  recordId: number,
  file: UploadFile | globalThis.File
): Promise<OcrJobResponse> {
  const form = new FormData();
  if ('uri' in file) {
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  } else {
    form.append('file', file as any);
  }
  form.append('record_id', String(recordId));
  const res = await apiClient.post<OcrJobResponse>('/ocr/jobs/upload', form, {
    headers: { 'Content-Type': undefined },
  });
  return res.data;
}
