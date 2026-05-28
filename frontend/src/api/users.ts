import { apiClient } from './client';
import type {
  UserInfo, UpdateUserRequest,
  ChangePasswordRequest, ConsentsResponse, ConsentType,
} from './types';

export async function getMe(): Promise<UserInfo> {
  const res = await apiClient.get<UserInfo>('/users/me');
  return res.data;
}

export async function updateMe(data: UpdateUserRequest): Promise<UserInfo> {
  const res = await apiClient.patch<UserInfo>('/users/me', data);
  return res.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  const res = await apiClient.patch<{ message: string }>('/users/me/password', data);
  return res.data;
}

export async function deleteAccount(password: string): Promise<{ detail: string }> {
  const res = await apiClient.delete<{ detail: string }>('/users/me', { data: { password } });
  return res.data;
}

export async function getConsents(): Promise<ConsentsResponse> {
  const res = await apiClient.get<ConsentsResponse>('/users/me/consents');
  return res.data;
}

export async function updateConsent(type: ConsentType, is_agreed: boolean): Promise<void> {
  await apiClient.patch(`/users/me/consents/${type}`, { is_agreed });
}
