import { NotificationService } from './notification.service';

// Ejemplo: Cuando un doctor emite una receta
export async function notifyPrescriptionCreated(patientId: string, doctorName: string) {
  await NotificationService.sendToUser(patientId, {
    title: '📋 Nueva Receta Médica',
    body: `El Dr. ${doctorName} ha emitido una receta para ti`,
    data: {
      type: 'prescription',
      action: 'view',
    },
    userId: patientId,
  });
}

// Ejemplo: Cuando un repartidor acepta un pedido
export async function notifyOrderAccepted(patientId: string, driverName: string) {
  await NotificationService.sendToUser(patientId, {
    title: '✅ Pedido Aceptado',
    body: `${driverName} ha aceptado tu pedido y va en camino`,
    data: {
      type: 'delivery',
      action: 'track',
    },
    userId: patientId,
  });
}

// Ejemplo: Cuando un repartidor está cerca
export async function notifyDriverNearby(patientId: string, minutesAway: number) {
  await NotificationService.sendToUser(patientId, {
    title: '🚗 Tu repartidor está cerca',
    body: `Tu pedido estará contigo en aproximadamente ${minutesAway} minutos`,
    data: {
      type: 'delivery',
      action: 'track',
    },
    userId: patientId,
  });
}

// Ejemplo: Cuando un pedido es entregado
export async function notifyOrderDelivered(patientId: string) {
  await NotificationService.sendToUser(patientId, {
    title: '📦 Pedido Entregado',
    body: 'Tu pedido ha sido entregado. ¡Gracias por confiar en Oasis!',
    data: {
      type: 'delivery',
      action: 'rate',
    },
    userId: patientId,
  });
}

// Ejemplo: Recordatorio de medicación (cron job)
export async function notifyMedicationReminder(patientId: string, medicineName: string) {
  await NotificationService.sendToUser(patientId, {
    title: '💊 Recordatorio de Medicación',
    body: `Es hora de tomar tu ${medicineName}`,
    data: {
      type: 'medication',
      action: 'confirm',
    },
    userId: patientId,
  });
}
