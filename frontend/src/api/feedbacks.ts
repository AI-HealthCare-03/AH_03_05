import { apiClient } from './client';
import type { CreateFeedbackRequest, CreateFeedbackResponse, FeedbackSummaryResponse } from './types';

export async function createFeedback(data: CreateFeedbackRequest): Promise<CreateFeedbackResponse> {
  const res = await apiClient.post<CreateFeedbackResponse>('/feedbacks', data);
  return res.data;
}

export async function getFeedbackSummary(): Promise<FeedbackSummaryResponse> {
  const res = await apiClient.get<FeedbackSummaryResponse>('/feedbacks/summary');
  return res.data;
}
