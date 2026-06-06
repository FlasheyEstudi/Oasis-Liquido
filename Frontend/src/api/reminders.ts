import { get, post, patch, del } from './client';

export interface MedicationReminder {
  id: string;
  userId: string;
  prescriptionLineId: string;
  medicineName: string;
  dosageInstructions: string;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped';
  lastNotified: string | null;
  createdAt: string;
  updatedAt: string;
  prescriptionLine?: {
    id: string;
    prescriptionId: string;
    medicineId: string;
    medicine?: {
      name: string;
    };
  };
}

/**
 * Listar todos los recordatorios activos del paciente
 */
export async function listReminders() {
  return get<MedicationReminder[]>('/reminders');
}

/**
 * Crear un nuevo recordatorio de medicación
 */
export async function createReminder(data: { prescription_line_id: string; scheduled_time: string }) {
  return post<MedicationReminder>('/reminders', data);
}

/**
 * Actualizar el estado de adherencia de un recordatorio (tomado, saltado, etc.)
 */
export async function updateReminderStatus(id: string, status: 'pending' | 'taken' | 'skipped') {
  return patch<MedicationReminder>(`/reminders/${id}`, { status });
}

/**
 * Eliminar un recordatorio de medicación
 */
export async function deleteReminder(id: string) {
  return del<{ success: boolean }>(`/reminders/${id}`);
}
