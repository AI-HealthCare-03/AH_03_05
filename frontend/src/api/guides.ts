import { apiClient } from './client';
import type { CreateGuideRequest, CreateGuideResponse, GuideResponse } from './types';

// ⚠ Backend TODO: POST /guides
export async function createGuide(data: CreateGuideRequest): Promise<CreateGuideResponse> {
  const res = await apiClient.post<CreateGuideResponse>('/guides', data);
  return res.data;
}

// ⚠ Backend TODO: GET /guides/{guide_id}
export async function getGuide(guideId: number): Promise<GuideResponse> {
  const res = await apiClient.get<GuideResponse>(`/guides/${guideId}`);
  return res.data;
}
