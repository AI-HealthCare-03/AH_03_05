import { apiClient } from './client';
import type { ProcessingJobResponse } from './types';

export async function getProcessingJob(jobId: number): Promise<ProcessingJobResponse> {
  const res = await apiClient.get<ProcessingJobResponse>(`/processing-jobs/${jobId}`);
  return res.data;
}
