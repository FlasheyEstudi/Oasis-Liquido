import { messaging } from '@/lib/firebase/admin';
import { db } from '@/lib/db';
import { emitNotification } from '@/lib/socket';

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
      tokens = (await db.pushToken.findMany({
        where: { userId },
        select: { token: true },
      })) || [];
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

  /**
   * Crear y guardar una notificación en la base de datos, y enviarla por socket + FCM.
   */
  static async createNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: string;
    link?: string;
  }): Promise<any> {
    try {
      // 1. Guardar en base de datos
      const notification = await db.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          body: data.body,
          type: data.type,
          link: data.link || null,
        },
      });

      // 2. Emitir en tiempo real por Socket.io
      emitNotification(data.userId, notification);

      // 3. Enviar vía FCM Push Notification
      await this.sendToUser(data.userId, {
        userId: data.userId,
        title: data.title,
        body: data.body,
        data: {
          id: notification?.id || '',
          type: data.type,
          link: data.link || '',
        },
      });

      return notification;
    } catch (error) {
      console.error('Error in NotificationService.createNotification:', error);
      throw error;
    }
  }

  /**
   * Listar las notificaciones de un usuario (paginado, opcionalmente filtrando por isRead)
   */
  static async listForUser(
    userId: string,
    params: { page?: number; limit?: number; isRead?: boolean } = {}
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params.isRead !== undefined) {
      where.isRead = params.isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Marcar una o todas las notificaciones como leídas
   */
  static async markAsRead(userId: string, notificationId?: string): Promise<any> {
    if (notificationId) {
      return await db.notification.update({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
    } else {
      return await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }
  }
}

