import { apiClient } from './client';
import type { VerifyMedicationRequest, VerifyMedicationResponse } from './types';

export async function verifyMedication(
  medicationId: number,
  data: VerifyMedicationRequest,
): Promise<VerifyMedicationResponse> {
  const res = await apiClient.patch<VerifyMedicationResponse>(
    `/medications/${medicationId}/verify`,
    data,
  );
  return res.data;
}
