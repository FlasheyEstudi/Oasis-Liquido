// ============================================
// OASIS - Notifications API Service
// ============================================

import { get, patch, post, del } from './client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

/** Register device FCM push token in the Backend */
export async function registerPushToken(token: string): Promise<any> {
  const result = await post('/users/me/fcm-token', { token });
  return result.data;
}

/** Unregister own device FCM push token in the Backend */
export async function unregisterPushToken(): Promise<any> {
  const result = await del('/users/me/fcm-token');
  return result.data;
}

export async function getNotifications(params?: { page?: number; limit?: number }): Promise<{
  data: Notification[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const result = await get<any>('/notifications', params as Record<string, any>);
  const notificationsArray = result.data?.notifications || [];
  const paginationObj = result.data?.pagination || {
    page: 1,
    limit: 20,
    total: notificationsArray.length,
    totalPages: 1
  };
  return {
    data: notificationsArray,
    pagination: paginationObj
  };
}

/** Mark a specific notification or all notifications as read */
export async function markNotificationsAsRead(data: { notificationId?: string; all?: boolean }): Promise<any> {
  const result = await patch('/notifications/mark-read', data);
  return result.data;
}
