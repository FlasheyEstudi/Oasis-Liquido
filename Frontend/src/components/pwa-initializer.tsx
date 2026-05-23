"use client";

import { useEffect } from 'react';
import { autoSyncPushToken, isPushSupported } from '@/lib/push-manager';
import { messaging } from '@/lib/firebase-config';

/**
 * PWAInitializer: Client-side component to handle automatic background tasks
 * like PWA synchronization, autoSyncPushToken, connectivity listeners, etc.
 */
export function PWAInitializer() {
  useEffect(() => {
    // Safely sync FCM token on app startup
    const initPWA = async () => {
      try {
        if (!isPushSupported()) {
          console.log('ℹ️ [OASIS PWA] Push notifications are not supported in this browser environment.');
          return;
        }

        if (!messaging) {
          console.log('ℹ️ [OASIS PWA] FCM messaging is disabled (credentials unconfigured). Skipping push token sync.');
          return;
        }

        await autoSyncPushToken();
      } catch (error) {
        console.warn('⚠️ [OASIS PWA] Failed to automatically sync push token on startup:', error);
      }
    };

    initPWA();
  }, []);

  return null;
}

export default PWAInitializer;
