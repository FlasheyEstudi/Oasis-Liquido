"use client";

import { useEffect } from 'react';
import { autoSyncPushToken } from '@/lib/push-manager';

/**
 * PWAInitializer: Client-side component to handle automatic background tasks
 * like PWA synchronization, autoSyncPushToken, connectivity listeners, etc.
 */
export function PWAInitializer() {
  useEffect(() => {
    // Safely sync FCM token on app startup
    const initPWA = async () => {
      try {
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
