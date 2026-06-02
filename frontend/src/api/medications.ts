import { apiClient } from './client';
import type {
  MedicationVerifyItem,
  VerifyMedicationResponse,
  MedicationsBatchVerifyResponse,
  MedicationAlarm,
  MedicationAlarmUpdateRequest,
  MedicationDosageUpdateRequest,
  MedicationDosageUpdateResponse,
} from './types';

export async function verifyMedication(
  medicationId: number,
  data: MedicationVerifyItem
): Promise<VerifyMedicationResponse> {
  const res = await apiClient.patch<VerifyMedicationResponse>(
    `/medications/${medicationId}/verify`,
    data
  );
  return res.data;
}

export async function verifyMedications(
  recordId: number,
  verifications: MedicationVerifyItem[]
): Promise<MedicationsBatchVerifyResponse> {
  const res = await apiClient.post<MedicationsBatchVerifyResponse>(
    `/records/${recordId}/medications/verify`,
    { verifications }
  );
  return res.data;
}

export async function updateMedicationDosage(
  medicationId: number,
  data: MedicationDosageUpdateRequest
): Promise<MedicationDosageUpdateResponse> {
  const res = await apiClient.patch<MedicationDosageUpdateResponse>(
    `/medications/${medicationId}`,
    data
  );
  return res.data;
}

export async function getMedicationAlarms(): Promise<MedicationAlarm[]> {
  const res = await apiClient.get<MedicationAlarm[]>('/medications/alarms');
  return res.data;
}

export async function updateMedicationAlarm(
  medicationId: number,
  data: MedicationAlarmUpdateRequest
): Promise<MedicationAlarm> {
  const res = await apiClient.patch<MedicationAlarm>(`/medications/${medicationId}/alarm`, data);
  return res.data;
}
