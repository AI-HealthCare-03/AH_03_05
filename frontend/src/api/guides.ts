import { apiClient } from './client';
import type { CreateGuideRequest, CreateGuideResponse, GuideResponse } from './types';

export async function createGuide(data: CreateGuideRequest): Promise<CreateGuideResponse> {
  const res = await apiClient.post<CreateGuideResponse>('/guides/generate', data);
  return res.data;
}

export async function getGuide(guideId: number): Promise<GuideResponse> {
  const res = await apiClient.get<GuideResponse>(`/guides/${guideId}`);
  return res.data;
}
