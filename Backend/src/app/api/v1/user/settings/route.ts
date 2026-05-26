import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.userId;

    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          userId,
          theme: 'system',
          notificationsEnabled: true,
          notificationPreferences: {
            language: 'es',
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            twoFactorEnabled: false,
            sessionTimeoutMinutes: 30,
          },
        },
      });
    }

    const prefs = (settings.notificationPreferences as any) || {};

    return successResponse({
      id: settings.id,
      userId: settings.userId,
      theme: settings.theme,
      notificationsEnabled: settings.notificationsEnabled,
      // Map preferences stored in notificationPreferences JSON
      language: prefs.language || 'es',
      emailNotifications: prefs.emailNotifications ?? true,
      pushNotifications: prefs.pushNotifications ?? true,
      smsNotifications: prefs.smsNotifications ?? false,
      twoFactorEnabled: prefs.twoFactorEnabled ?? false,
      sessionTimeoutMinutes: prefs.sessionTimeoutMinutes ?? 30,
      // raw fields
      notificationPreferences: settings.notificationPreferences,
    });
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener la configuración del usuario', 500);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user.userId;
    const body = await req.json();
    const { 
      theme, 
      notificationsEnabled, 
      notificationPreferences,
      language,
      emailNotifications,
      pushNotifications,
      smsNotifications,
      twoFactorEnabled,
      sessionTimeoutMinutes
    } = body;

    // Load existing settings first to preserve other JSON properties
    let currentSettings = await db.userSettings.findUnique({
      where: { userId },
    });

    const currentPrefs = (currentSettings?.notificationPreferences as Record<string, any>) || {};
    const updatedPrefs = {
      ...currentPrefs,
      ...(notificationPreferences || {}),
    };

    if (language !== undefined) updatedPrefs.language = language;
    if (emailNotifications !== undefined) updatedPrefs.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updatedPrefs.pushNotifications = pushNotifications;
    if (smsNotifications !== undefined) updatedPrefs.smsNotifications = smsNotifications;
    if (twoFactorEnabled !== undefined) updatedPrefs.twoFactorEnabled = twoFactorEnabled;
    if (sessionTimeoutMinutes !== undefined) updatedPrefs.sessionTimeoutMinutes = sessionTimeoutMinutes;

    const settings = await db.userSettings.upsert({
      where: { userId },
      update: {
        theme: theme !== undefined ? theme : undefined,
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : undefined,
        notificationPreferences: updatedPrefs,
      },
      create: {
        userId,
        theme: theme || 'system',
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
        notificationPreferences: updatedPrefs,
      },
    });

    return successResponse({
      id: settings.id,
      userId: settings.userId,
      theme: settings.theme,
      notificationsEnabled: settings.notificationsEnabled,
      language: updatedPrefs.language || 'es',
      emailNotifications: updatedPrefs.emailNotifications ?? true,
      pushNotifications: updatedPrefs.pushNotifications ?? true,
      smsNotifications: updatedPrefs.smsNotifications ?? false,
      twoFactorEnabled: updatedPrefs.twoFactorEnabled ?? false,
      sessionTimeoutMinutes: updatedPrefs.sessionTimeoutMinutes ?? 30,
      notificationPreferences: settings.notificationPreferences,
    });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar la configuración del usuario', 500);
  }
});
