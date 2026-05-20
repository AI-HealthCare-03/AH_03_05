import { apiClient } from './client';
import type {
  RecordUploadResponse, RecordType,
  RecordListResponse, RecordDetail,
  RecordMedicationsResponse, RecordGuideResponse,
  OcrResultResponse, OcrTextUpdateRequest, OcrTextUpdateResponse,
} from './types';

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export async function uploadRecord(
  file: UploadFile,
  record_type: RecordType,
): Promise<RecordUploadResponse> {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  form.append('record_type', record_type);
  const res = await apiClient.post<RecordUploadResponse>('/records', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
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

// ⚠ Backend TODO: DELETE /records/{record_id}
export async function deleteRecord(recordId: number): Promise<void> {
  await apiClient.delete(`/records/${recordId}`);
}

// ⚠ Backend TODO: GET /records/{record_id}/medications
export async function getRecordMedications(recordId: number): Promise<RecordMedicationsResponse> {
  const res = await apiClient.get<RecordMedicationsResponse>(`/records/${recordId}/medications`);
  return res.data;
}

// ⚠ Backend TODO: GET /records/{record_id}/guide
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
  data: OcrTextUpdateRequest,
): Promise<OcrTextUpdateResponse> {
  const res = await apiClient.patch<OcrTextUpdateResponse>(`/records/${recordId}/ocr-text`, data);
  return res.data;
}
