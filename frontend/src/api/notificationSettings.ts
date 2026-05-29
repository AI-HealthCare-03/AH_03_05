import { apiClient } from './client';
import type { NotificationSettingsResponse, NotificationSettingsUpdate } from './types';

export async function getNotificationSettings(): Promise<NotificationSettingsResponse> {
  const res = await apiClient.get<NotificationSettingsResponse>('/notification-settings/');
  return res.data;
}

export async function updateNotificationSettings(
  data: NotificationSettingsUpdate,
): Promise<NotificationSettingsResponse> {
  const res = await apiClient.put<NotificationSettingsResponse>('/notification-settings/', data);
  return res.data;
}
