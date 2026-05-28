import { apiClient } from './client';
import type { HealthProfile, HealthProfileUpdateRequest, HealthProfileUpdateResponse } from './types';

export async function getHealthProfile(): Promise<HealthProfile> {
  const res = await apiClient.get<HealthProfile>('/health-profile');
  return res.data;
}

export async function upsertHealthProfile(
  data: HealthProfileUpdateRequest,
): Promise<HealthProfileUpdateResponse> {
  const res = await apiClient.put<HealthProfileUpdateResponse>('/health-profile', data);
  return res.data;
}
