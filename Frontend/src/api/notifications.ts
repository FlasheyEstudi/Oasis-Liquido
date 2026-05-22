// ============================================
// OASIS - Notifications API Service
// POST /users/me/fcm-token
// DELETE /users/me/fcm-token
// ============================================

import { post, del } from './client';

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
