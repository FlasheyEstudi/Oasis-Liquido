import * as admin from 'firebase-admin';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin safely without static compile-time require() imports
if (!admin.apps.length) {
  try {
    let serviceAccount: any = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // Find the service account file dynamically without triggering compile-time analyzer errors
      const filePath = path.resolve(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ [OASIS BACKEND] Firebase Service Account credentials not found. Push notifications will be disabled.');
    }
  } catch (error) {
    console.warn('⚠️ Firebase Admin could not be initialized. Push notifications will be disabled.', error);
  }
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  if (admin.apps.length === 0) {
    console.log(`ℹ️ [OASIS BACKEND] Firebase Admin not initialized. Skipping notification to ${userId}.`);
    return;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (!user?.fcmToken) {
      console.log(`ℹ️ User ${userId} has no FCM token. Skipping notification.`);
      return;
    }

    const message = {
      notification: { title, body },
      data: data || {},
      token: user.fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Push notification sent to user ${userId}:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Error sending push notification to user ${userId}:`, error);
  }
}

/**
 * Send a notification to multiple users (e.g., all doctors in a clinic)
 */
export async function sendMulticastNotification(tokens: string[], title: string, body: string, data?: any) {
  if (admin.apps.length === 0 || tokens.length === 0) {
    return;
  }

  const message = {
    notification: { title, body },
    data: data || {},
    tokens: tokens.filter(t => !!t),
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Multicast notification sent to ${response.successCount} devices`);
    return response;
  } catch (error) {
    console.error('❌ Error sending multicast notification:', error);
  }
}
