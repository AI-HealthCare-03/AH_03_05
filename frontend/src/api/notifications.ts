import { apiClient } from './client';
import type {
  NotificationListResponse, UnreadCountResponse, ReadNotificationResponse,
} from './types';

// ⚠ Backend TODO: GET /notifications
export async function getNotifications(params?: {
  page?: number;
  size?: number;
  is_read?: boolean;
}): Promise<NotificationListResponse> {
  const res = await apiClient.get<NotificationListResponse>('/notifications', { params });
  return res.data;
}

// ⚠ Backend TODO: GET /notifications/unread-count
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const res = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  return res.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}

// ⚠ Backend TODO: PATCH /notifications/{notification_id}/read
export async function markNotificationRead(
  notificationId: number,
): Promise<ReadNotificationResponse> {
  const res = await apiClient.patch<ReadNotificationResponse>(
    `/notifications/${notificationId}/read`,
  );
  return res.data;
}

// ⚠ Backend TODO: DELETE /notifications/{notification_id}
export async function deleteNotification(notificationId: number): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}
