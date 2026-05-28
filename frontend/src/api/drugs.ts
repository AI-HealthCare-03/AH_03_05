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

export async function getDrug(drugId: number): Promise<DrugDetail> {
  const res = await apiClient.get<DrugDetail>(`/drugs/${drugId}`);
  return res.data;
}
