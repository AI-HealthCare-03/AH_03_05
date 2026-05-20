import { apiClient } from './client';
import type { OcrJobRequest, OcrJobResponse } from './types';

export async function createOcrJob(data: OcrJobRequest): Promise<OcrJobResponse> {
  const res = await apiClient.post<OcrJobResponse>('/ocr/jobs', data);
  return res.data;
}
