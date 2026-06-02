import { apiClient } from './client';
import type {
  RecordUploadResponse,
  ManualInputResponse,
  RecordType,
  RecordListResponse,
  RecordDetail,
  RecordMedicationsResponse,
  RecordGuideResponse,
  OcrResultResponse,
  OcrTextUpdateRequest,
  OcrTextUpdateResponse,
} from './types';

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export async function uploadRecord(
  file: UploadFile | globalThis.File,
  record_type: RecordType
): Promise<RecordUploadResponse> {
  const form = new FormData();
  if ('uri' in file) {
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  } else {
    form.append('file', file as any);
  }
  form.append('record_type', record_type);
  const res = await apiClient.post<RecordUploadResponse>('/records', form, {
    headers: { 'Content-Type': undefined },
  });
  return res.data;
}

export async function createManualRecord(ocr_edited_text: string): Promise<ManualInputResponse> {
  const res = await apiClient.post<ManualInputResponse>('/records/manual-input', {
    record_type: 'manual',
    ocr_edited_text,
  });
  return res.data;
}

export async function getRecords(params?: {
  page?: number;
  size?: number;
  record_type?: RecordType;
}): Promise<RecordListResponse> {
  const res = await apiClient.get<RecordListResponse>('/records', { params });
  return res.data;
}

export async function getRecord(recordId: number): Promise<RecordDetail> {
  const res = await apiClient.get<RecordDetail>(`/records/${recordId}`);
  return res.data;
}

export async function deleteRecord(recordId: number): Promise<void> {
  await apiClient.delete(`/records/${recordId}`);
}

// TODO: [BE 대기] GET /records/{record_id}/medications — 구현 완료 후 RecordDetailScreen __DEV__ 분기 제거
export async function getRecordMedications(recordId: number): Promise<RecordMedicationsResponse> {
  const res = await apiClient.get<RecordMedicationsResponse>(`/records/${recordId}/medications`);
  return res.data;
}

// TODO: [BE 대기] GET /records/{record_id}/guide — 구현 완료 후 RecordDetailScreen __DEV__ 분기 제거
export async function getRecordGuide(recordId: number): Promise<RecordGuideResponse> {
  const res = await apiClient.get<RecordGuideResponse>(`/records/${recordId}/guide`);
  return res.data;
}

export async function getOcrResult(recordId: number): Promise<OcrResultResponse> {
  const res = await apiClient.get<OcrResultResponse>(`/records/${recordId}/ocr-result`);
  return res.data;
}

export async function updateOcrText(
  recordId: number,
  data: OcrTextUpdateRequest
): Promise<OcrTextUpdateResponse> {
  const res = await apiClient.patch<OcrTextUpdateResponse>(`/records/${recordId}/ocr-text`, data);
  return res.data;
}
