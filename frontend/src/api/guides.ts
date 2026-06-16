import { apiClient } from './client';
import type { CreateGuideRequest, CreateGuideResponse, GuideResponse } from './types';

export async function createGuide(data: CreateGuideRequest): Promise<CreateGuideResponse> {
  // 동기 LLM 생성이라 기본 30초 타임아웃으로는 부족할 수 있어 요청 단위로 늘린다.
  const res = await apiClient.post<CreateGuideResponse>('/guides/generate', data, {
    timeout: 90_000,
  });
  return res.data;
}

export async function getGuide(guideId: number): Promise<GuideResponse> {
  const res = await apiClient.get<GuideResponse>(`/guides/${guideId}`);
  return res.data;
}
