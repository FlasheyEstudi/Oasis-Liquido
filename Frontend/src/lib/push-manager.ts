// ============================================
// OASIS - Push Notification Manager
// Handles notification permissions, FCM registration, and token management
// ============================================

import { messaging } from './firebase-config';
import { getToken, deleteToken } from 'firebase/messaging';
import { registerPushToken, unregisterPushToken } from '@/api/notifications';

// VAPID Key is required for Web Push. Read from env or warning placeholder.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'PLACEHOLDER_VAPID_KEY';

/**
 * Check if the browser supports push notifications and FCM
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
}

/**
 * Ask permission and register token
 * Returns token if successful, or null
 */
export async function requestAndRegisterPush(): Promise<string | null> {
  if (!isPushSupported()) {
    console.warn('❌ [OASIS PWA] Push notifications are not supported in this browser.');
    return null;
  }

  if (!messaging) {
    console.warn('❌ [OASIS PWA] Firebase Messaging is not initialized.');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('ℹ️ [OASIS PWA] Notification permission was denied/ignored.');
      return null;
    }

    // Get FCM registration token
    // We pass the active service worker registration to getToken() to ensure it uses our custom sw.js
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY === 'PLACEHOLDER_VAPID_KEY' ? undefined : VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('🔥 [OASIS PWA] FCM Token acquired:', token);
      
      // Save token in Backend
      await registerPushToken(token);
      
      // Save token locally in localStorage for tracking
      localStorage.setItem('oasis_fcm_token', token);
      return token;
    } else {
      console.warn('⚠️ [OASIS PWA] No FCM registration token available.');
      return null;
    }
  } catch (error) {
    console.error('❌ [OASIS PWA] Error acquiring / registering push token:', error);
    return null;
  }
}

/**
 * Unregister push token from backend and local storage
 */
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;

  try {
    if (messaging) {
      await deleteToken(messaging);
    }
    
    // Call backend to remove token
    await unregisterPushToken();
    
    // Clear local storage
    localStorage.removeItem('oasis_fcm_token');
    console.log('✅ [OASIS PWA] Push notifications disabled.');
  } catch (error) {
    console.error('❌ [OASIS PWA] Error disabling push notifications:', error);
  }
}

/**
 * Auto-sync FCM token on startup if permission is already granted.
 * Ensures the backend always has the latest token.
 */
export async function autoSyncPushToken(): Promise<void> {
  if (!isPushSupported()) return;

  if (Notification.permission === 'granted' && messaging) {
    const savedToken = localStorage.getItem('oasis_fcm_token');
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY === 'PLACEHOLDER_VAPID_KEY' ? undefined : VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken && currentToken !== savedToken) {
        console.log('🔄 [OASIS PWA] FCM Token updated or missing in backend. Re-registering...');
        await registerPushToken(currentToken);
        localStorage.setItem('oasis_fcm_token', currentToken);
      }
    } catch (error) {
      console.error('❌ [OASIS PWA] Error in autoSyncPushToken:', error);
    }
  }
}
