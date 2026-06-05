import { apiClient } from './client';
import type { CreateFeedbackRequest, CreateFeedbackResponse } from './types';

export async function createFeedback(data: CreateFeedbackRequest): Promise<CreateFeedbackResponse> {
  const res = await apiClient.post<CreateFeedbackResponse>('/feedbacks', data);
  return res.data;
}
