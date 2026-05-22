import { apiClient } from './client';
import type { MedicationVerifyItem, VerifyMedicationResponse } from './types';

export async function verifyMedication(
  medicationId: number,
  data: MedicationVerifyItem,
): Promise<VerifyMedicationResponse> {
  const res = await apiClient.patch<VerifyMedicationResponse>(
    `/medications/${medicationId}/verify`,
    data,
  );
  return res.data;
}
