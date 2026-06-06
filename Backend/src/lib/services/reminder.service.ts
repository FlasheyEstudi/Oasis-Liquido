import { db } from '../db';
import { NotificationService } from './notification.service';

export class ReminderService {
  /**
   * Crear un nuevo recordatorio de medicación
   */
  static async createReminder(userId: string, data: { prescriptionLineId: string; scheduledTime: string }) {
    // 1. Obtener la línea de la receta con el medicamento
    const line = await db.prescriptionLine.findUnique({
      where: { id: data.prescriptionLineId },
      include: { medicine: true, prescription: true },
    });

    if (!line) {
      throw new Error('PRESCRIPTION_LINE_NOT_FOUND');
    }

    // 2. Verificar que pertenece al usuario
    if (line.prescription.patientId !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    // 3. Verificar si ya existe un recordatorio para este medicamento y hora
    const existing = await db.medicationReminder.findFirst({
      where: {
        userId,
        prescriptionLineId: data.prescriptionLineId,
        scheduledTime: data.scheduledTime,
      },
    });

    if (existing) {
      return existing;
    }

    // 4. Crear el recordatorio
    return await db.medicationReminder.create({
      data: {
        userId,
        prescriptionLineId: data.prescriptionLineId,
        medicineName: line.medicine.name,
        dosageInstructions: line.dosageInstructions,
        scheduledTime: data.scheduledTime,
        status: 'pending',
      },
    });
  }

  /**
   * Listar todos los recordatorios activos del paciente
   */
  static async listReminders(userId: string) {
    return await db.medicationReminder.findMany({
      where: { userId },
      include: {
        prescriptionLine: {
          include: {
            medicine: true,
          },
        },
      },
      orderBy: [
        { scheduledTime: 'asc' },
      ],
    });
  }

  /**
   * Actualizar el estado de adherencia de un recordatorio (tomado, saltado, etc.)
   */
  static async updateReminderStatus(userId: string, reminderId: string, status: string) {
    const reminder = await db.medicationReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new Error('NOT_FOUND');
    }

    if (reminder.userId !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    return await db.medicationReminder.update({
      where: { id: reminderId },
      data: { status, updatedAt: new Date() },
    });
  }

  /**
   * Eliminar un recordatorio
   */
  static async deleteReminder(userId: string, reminderId: string) {
    const reminder = await db.medicationReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new Error('NOT_FOUND');
    }

    if (reminder.userId !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    return await db.medicationReminder.delete({
      where: { id: reminderId },
    });
  }

  /**
   * Servicio en segundo plano para notificar las dosis correspondientes a la hora actual
   */
  static async sendRemindersForCurrentHour() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const timePrefix = `${hours}:`;

    console.log(`[ReminderService] Ejecutando recordatorios para el prefijo de hora: ${timePrefix}`);

    // Buscar recordatorios que coincidan con la hora actual y no hayan sido notificados hoy
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const reminders = await db.medicationReminder.findMany({
      where: {
        scheduledTime: {
          startsWith: timePrefix,
        },
        OR: [
          { lastNotified: null },
          { lastNotified: { lt: startOfToday } },
        ],
      },
      include: {
        prescriptionLine: true,
      },
    });

    console.log(`[ReminderService] Se encontraron ${reminders.length} recordatorios pendientes de envío.`);

    for (const reminder of reminders) {
      try {
        // Enviar la notificación push
        await NotificationService.createNotification({
          userId: reminder.userId,
          title: '⏰ Recordatorio de Medicación',
          body: `Es hora de tomar tu dosis de ${reminder.medicineName}: ${reminder.dosageInstructions}.`,
          type: 'medication_reminder',
          link: `/recetas/${reminder.prescriptionLine.prescriptionId}`,
        });

        // Actualizar el recordatorio: marcar como notificado y reiniciar estado a "pending" para el nuevo día
        await db.medicationReminder.update({
          where: { id: reminder.id },
          data: {
            lastNotified: now,
            status: 'pending', // reiniciar para registrar toma de dosis del día
          },
        });
      } catch (err) {
        console.error(`Error enviando notificación para recordatorio ${reminder.id}:`, err);
      }
    }

    return reminders.length;
  }
}
