// ============================================
// OASIS - Firebase Client Configuration
// Initializes Firebase Client SDK for FCM push notifications
// ============================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

// Firebase configuration from environment variables or placeholders
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'PLACEHOLDER_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'oasis-nicaragua.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'oasis-nicaragua',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'oasis-nicaragua.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef0123456789abcdef',
};

// Check if credentials are placeholders
const isPlaceholder = firebaseConfig.apiKey === 'PLACEHOLDER_API_KEY';
if (isPlaceholder && typeof window !== 'undefined') {
  console.warn(
    '⚠️ [OASIS PWA] Using placeholder Firebase credentials. Real push notifications require configuring environment variables in .env.local.'
  );
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Messaging (only in browser environment)
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('⚠️ [OASIS PWA] Firebase Messaging could not be initialized in this browser.', error);
  }
}

export { app, messaging };
export default app;
