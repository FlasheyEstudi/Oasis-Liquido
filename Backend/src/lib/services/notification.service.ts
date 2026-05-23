import { messaging } from '@/lib/firebase/admin';
import { db } from '@/lib/db';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  userId: string;
}

export class NotificationService {
  /**
   * Registrar token FCM de un dispositivo
   */
  static async registerToken(userId: string, token: string, deviceInfo?: string): Promise<void> {
    if (!token) {
      throw new Error('Token is required');
    }

    try {
      // Verificar si el token ya existe
      const existing = await db.pushToken.findUnique({
        where: { token },
      });

      if (existing) {
        // Si ya existe pero es de otro usuario, actualizar
        if (existing.userId !== userId) {
          await db.pushToken.update({
            where: { token },
            data: { userId, deviceInfo, updatedAt: new Date() },
          });
        }
        return;
      }

      // Crear nuevo token
      await db.pushToken.create({
        data: {
          userId,
          token,
          deviceInfo,
        },
      });
    } catch (dbError) {
      console.warn('Database error while registering push token, running in fallback mode:', dbError);
    }
  }

  /**
   * Eliminar token (cuando el usuario cierra sesión o desinstala)
   */
  static async unregisterToken(token: string): Promise<void> {
    try {
      await db.pushToken.deleteMany({
        where: { token },
      });
    } catch (dbError) {
      console.warn('Database error while unregistering push token:', dbError);
    }
  }

  /**
   * Enviar notificación a un usuario específico
   * Envía a TODOS los dispositivos del usuario
   */
  static async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    let tokens: { token: string }[] = [];
    try {
      // Buscar todos los tokens del usuario
      tokens = await db.pushToken.findMany({
        where: { userId },
        select: { token: true },
      });
    } catch (dbError) {
      console.warn('Database offline, checking fallback in-memory or skipping notifications:', dbError);
    }

    if (tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    const tokenList = tokens.map(t => t.token);

    if (!messaging) {
      console.warn('⚠️ Firebase Messaging Admin SDK is not initialized, mock sending notification:', payload);
      return;
    }

    // Enviar notificación a todos los dispositivos
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: tokenList,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      
      // Limpiar tokens fallidos (expirados o inválidos)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokenList[idx]);
          }
        });
        
        if (failedTokens.length > 0) {
          try {
            await db.pushToken.deleteMany({
              where: { token: { in: failedTokens } },
            });
            console.log(`Cleaned up ${failedTokens.length} expired tokens`);
          } catch (dbDelError) {
            console.warn('Could not delete failed tokens from database:', dbDelError);
          }
        }
      }
      
      console.log(`Notification sent to ${tokens.length} devices, ${response.successCount} succeeded`);
    } catch (error) {
      console.error('Error sending notification:', error);
      // No lanzar error para no bloquear el flujo principal
    }
  }

  /**
   * Enviar notificación a múltiples usuarios
   */
  static async sendToUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
    const promises = userIds.map(userId => this.sendToUser(userId, payload));
    await Promise.all(promises);
  }
}
