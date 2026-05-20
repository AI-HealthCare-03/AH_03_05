import { apiClient } from './client';
import type { DrugSearchResponse, DrugDetail } from './types';

export interface DrugSearchParams {
  q: string;
  search_type?: string;
  page?: number;
  size?: number;
}

// Spec uses `q` + `size`; backend uses `keyword` + `limit` — transformed here
export async function searchDrugs(params: DrugSearchParams): Promise<DrugSearchResponse> {
  const res = await apiClient.get<DrugSearchResponse>('/drugs/search', {
    params: {
      keyword: params.q,
      search_type: params.search_type,
      page: params.page,
      limit: params.size,
    },
  });
  return res.data;
}

// ⚠ Backend TODO: GET /drugs/{drug_id}
export async function getDrug(drugId: number): Promise<DrugDetail> {
  const res = await apiClient.get<DrugDetail>(`/drugs/${drugId}`);
  return res.data;
}
