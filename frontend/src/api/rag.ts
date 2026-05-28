import { apiClient } from './client';
import type { RagSource } from './types';

interface _RagSource {
  organization_name: string;
  guideline_title: string;
  source_url: string;
  chunk_text?: string;
  similarity_score: number;
}

interface _RagSearchResponse {
  query: string;
  sources: _RagSource[];
}

export async function searchGuidelines(query: string): Promise<RagSource[]> {
  const res = await apiClient.get<_RagSearchResponse>('/rag/search', { params: { query } });
  return res.data.sources.map((src, i) => ({
    source_id: i + 1,
    organization_name: src.organization_name,
    guideline_title: src.guideline_title,
    source_url: src.source_url,
    disease_or_topic: '',
    relevance_score: src.similarity_score,
    excerpt: src.chunk_text,
  }));
}
