import { apiClient } from './client';
import type {
  HealthProfile,
  HealthProfileUpdateRequest,
  HealthProfileUpdateResponse,
} from './types';

export async function getHealthProfile(): Promise<HealthProfile> {
  const res = await apiClient.get<HealthProfile>('/health-profile');
  return res.data;
}

// 온보딩 완료(=프로필 입력됨) 판정. age/gender는 선택 입력일 수 있어 특정 필드가 아니라
// 의미있는 값이 하나라도 있으면 입력된 것으로 본다. (서버를 완료 여부의 단일 출처로 삼음)
export function isHealthProfileFilled(p: HealthProfile | null | undefined): boolean {
  return !!(
    p &&
    (p.age_group ||
      p.gender ||
      p.chronic_diseases?.length ||
      p.allergies?.length ||
      p.current_medications?.length ||
      p.medical_history)
  );
}

export async function upsertHealthProfile(
  data: HealthProfileUpdateRequest
): Promise<HealthProfileUpdateResponse> {
  const res = await apiClient.put<HealthProfileUpdateResponse>('/health-profile', data);
  return res.data;
}
