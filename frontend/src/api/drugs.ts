import { apiClient } from './client';
import type { DrugSearchResponse, DrugDetail } from './types';

export interface DrugSearchParams {
  keyword: string;
  search_type?: string;
  page?: number;
  limit?: number;
}

export async function searchDrugs(params: DrugSearchParams): Promise<DrugSearchResponse> {
  const res = await apiClient.get<DrugSearchResponse>('/drugs/search', { params });
  return res.data;
}

// 상세 응답은 { drug_code, source, cache_used, data: {...} } 봉투 구조이며
// 용법·용량은 data.dosage로 온다(FE는 usage_method 사용). 봉투 해제 + 필드 매핑.
export async function getDrug(drugId: number): Promise<DrugDetail> {
  const res = await apiClient.get<{ data?: DrugDetail & { dosage?: string } } & Partial<DrugDetail>>(
    `/drugs/${drugId}`
  );
  const body = res.data;
  const d = (body.data ?? body) as DrugDetail & { dosage?: string };
  return { ...d, usage_method: d.usage_method ?? d.dosage };
}
