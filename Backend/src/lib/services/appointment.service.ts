// OASIS - Appointment Service
// CRUD and status management for appointments

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';
import { 
  notifyAppointmentCreatedForClinic, 
  notifyAppointmentBookedForDoctor,
  notifyAppointmentCanceledForClinic,
  notifyAppointmentCanceledForDoctor,
  notifyAppointmentRescheduled,
  notifyReceptionistsOfCheckIn
} from './event-notifications';

function formatDateTimeNI(date: Date): string {
  try {
    return date.toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'short' });
  } catch (e) {
    return date.toLocaleString('es-NI') || date.toString();
  }
}

/**
 * Get appointments with filters
 * Role-based filtering: patients see own, doctors see own, admin sees all
 */
export async function getAppointments(filters: {
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userRole?: string;
  userId?: string;
  page: number;
  limit: number;
  skip: number;
}) {
  const where: Record<string, unknown> = {};

  // Role-based filtering
  if (filters.userRole === 'patient' && filters.userId) {
    where.patientId = filters.userId;
  } else if (filters.userRole === 'doctor' && filters.userId) {
    where.doctorId = filters.userId;
  } else if (filters.userRole === 'clinic_admin' && filters.userId) {
    // Forzar el aislamiento para el Clinic Admin (solo sus clínicas)
    const ownedClinic = await db.clinic.findFirst({
      where: { ownerId: filters.userId }
    });
    if (ownedClinic) {
      where.clinicId = ownedClinic.id;
    } else {
      where.clinicId = 'non_existent_clinic_id'; // Bloquea acceso si no tiene clínica asociada
    }
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
  } else if (filters.userRole === 'receptionist' && filters.userId) {
    // Forzar el aislamiento para la Recepcionista (solo su clínica asignada)
    const recepProfile = await db.receptionistProfile.findUnique({
      where: { userId: filters.userId }
    });
    if (recepProfile && recepProfile.clinicId) {
      where.clinicId = recepProfile.clinicId;
    } else {
      where.clinicId = 'non_existent_clinic_id'; // Bloquea acceso si no tiene clínica asignada
    }
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
  } else {
    // admin (Super Admin) o cualquier otro rol ve según los filtros provistos
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.clinicId) where.clinicId = filters.clinicId;
  }

  if (filters.status) where.status = filters.status;

  if (filters.dateFrom || filters.dateTo) {
    const dateTime: Record<string, unknown> = {};
    if (filters.dateFrom) dateTime.gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateTime.lte = new Date(filters.dateTo);
    where.dateTime = dateTime;
  }

  const [data, total] = await Promise.all([
    db.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: { select: { id: true, name: true, email: true, doctorProfile: true } },
        clinic: true,
      },
      orderBy: { dateTime: 'desc' },
      skip: filters.skip,
      take: filters.limit,
    }),
    db.appointment.count({ where }),
  ]);

  return { data, total };
}

/**
 * Get single appointment by ID
 */
export async function getAppointment(id: string) {
  return db.appointment.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true, patientProfile: true } },
      doctor: { select: { id: true, name: true, email: true, doctorProfile: { include: { clinic: true } } } },
      clinic: true,
      prescriptions: { include: { prescriptionLines: { include: { medicine: true } } } },
    },
  });
}

/**
 * Create a new appointment
 */
export async function createAppointment(data: {
  doctor_id: string;
  clinic_id: string;
  date_time: string;
  duration_minutes?: number;
  notes?: string;
  patientId: string;
}, ipAddress?: string, userAgent?: string) {
  const startTime = new Date(data.date_time);
  const duration = data.duration_minutes || 30;
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Check for overlapping appointments for this doctor
  const conflict = await db.appointment.findFirst({
    where: {
      doctorId: data.doctor_id,
      status: { notIn: ['cancelled', 'no_show'] },
      OR: [
        // New appointment starts during an existing one
        {
          dateTime: { lte: startTime },
          updatedAt: { gte: startTime } // Wait, Prisma doesn't store endTime. We need to calculate it or assume standard duration.
        }
      ]
    }
  });

  // Better overlap check: 
  // (StartA < EndB) AND (EndA > StartB)
  // We don't have EndB in DB, so we assume duration is 30 mins if not specified.
  
  const existingAppointments = await db.appointment.findMany({
    where: {
      doctorId: data.doctor_id,
      status: { notIn: ['cancelled', 'no_show'] },
      dateTime: {
        gte: new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // Check within 24h range for efficiency
        lte: new Date(startTime.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  });

  for (const existing of existingAppointments) {
    const exStart = new Date(existing.dateTime);
    const exEnd = new Date(exStart.getTime() + (existing.durationMinutes || 30) * 60000);
    
    if (startTime < exEnd && endTime > exStart) {
      throw new Error('CONFLICT: El doctor ya tiene una cita en este horario');
    }
  }

  const appointment = await db.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctor_id,
      clinicId: data.clinic_id,
      dateTime: startTime,
      durationMinutes: duration,
      notes: data.notes,
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, doctorProfile: true } },
      clinic: true,
    },
  });

  // Audit log
  await createAuditLog({
    userId: data.patientId,
    action: 'create',
    entityType: 'appointment',
    entityId: appointment.id,
    ipAddress,
    userAgent,
  });

  // Trigger Notifications
  try {
    const dateStr = formatDateTimeNI(appointment.dateTime);
    notifyAppointmentBookedForDoctor(appointment.doctorId, appointment.patient?.name || 'Paciente', dateStr).catch(err => console.error(err));
    notifyAppointmentCreatedForClinic(appointment.clinicId, appointment.patient?.name || 'Paciente', appointment.doctor?.name || 'Médico', dateStr).catch(err => console.error(err));
  } catch (err) {
    console.error('Failed to dispatch appointment creation notifications:', err);
  }

  return appointment;
}

/**
 * Update appointment status with role-based authorization
 */
export async function updateAppointmentStatus(
  id: string,
  newStatus: string,
  userRole: string,
  userId: string,
  cancellationReason?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const appointment = await db.appointment.findUnique({ where: { id } });
  if (!appointment) {
    throw new Error('NOT_FOUND');
  }

  // Tenant / ownership validation
  let isAuthorized = false;
  if (userRole === 'admin') {
    isAuthorized = true;
  } else if (userRole === 'patient') {
    if (appointment.patientId === userId) {
      isAuthorized = true;
    } else {
      const caregiverRelation = await db.familyRelationship.findFirst({
        where: {
          caregiverId: userId,
          patientId: appointment.patientId,
          isActive: true,
          status: 'active',
        }
      });
      if (caregiverRelation) {
        isAuthorized = true;
      }
    }
  } else if (userRole === 'doctor') {
    if (appointment.doctorId === userId) {
      isAuthorized = true;
    } else {
      const profile = await db.doctorProfile.findUnique({ where: { userId } });
      if (profile && profile.clinicId === appointment.clinicId) {
        isAuthorized = true;
      }
    }
  } else if (userRole === 'receptionist' || userRole === 'clinic_admin') {
    if (userRole === 'receptionist') {
      const profile = await db.receptionistProfile.findUnique({ where: { userId } });
      if (profile && profile.clinicId === appointment.clinicId) {
        isAuthorized = true;
      }
    } else {
      const clinic = await db.clinic.findFirst({ where: { id: appointment.clinicId, ownerId: userId } });
      if (clinic) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new Error('UNAUTHORIZED');
  }

  const currentStatus = appointment.status;

  // Validate status transitions based on role
  const validTransitions: Record<string, Record<string, string[]>> = {
    scheduled: { confirmed: ['receptionist', 'doctor'], cancelled: ['patient', 'receptionist', 'doctor'], no_show: ['receptionist', 'doctor'] },
    confirmed: { in_progress: ['doctor'], cancelled: ['patient', 'receptionist', 'doctor'], no_show: ['receptionist', 'doctor'] },
    in_progress: { completed: ['doctor'] },
  };

  const allowedRoles = validTransitions[currentStatus]?.[newStatus];
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (cancellationReason) updateData.cancellationReason = cancellationReason;

  const updated = await db.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, doctorProfile: true } },
      clinic: true,
    },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'appointment',
    entityId: id,
    details: JSON.stringify({ field: 'status', from: currentStatus, to: newStatus }),
    ipAddress,
    userAgent,
  });

  // Trigger Notifications on cancellation
  if (newStatus === 'cancelled') {
    try {
      const dateStr = formatDateTimeNI(updated.dateTime);
      notifyAppointmentCanceledForDoctor(updated.doctorId, updated.patient?.name || 'Paciente', dateStr).catch(err => console.error(err));
      notifyAppointmentCanceledForClinic(updated.clinicId, updated.patient?.name || 'Paciente', updated.doctor?.name || 'Médico', dateStr).catch(err => console.error(err));
    } catch (err) {
      console.error('Failed to dispatch appointment cancellation notifications:', err);
    }
  } else if (newStatus === 'confirmed') {
    try {
      notifyReceptionistsOfCheckIn(updated.clinicId, updated.patient?.name || 'Paciente', updated.doctor?.name || 'Médico').catch(err => console.error(err));
    } catch (err) {
      console.error('Failed to dispatch receptionist check-in notification:', err);
    }
  }

  return updated;
}

/**
 * Update an appointment (e.g. reschedule date/time, notes, duration)
 */
export async function updateAppointment(
  id: string,
  data: { date_time?: string; duration_minutes?: number; notes?: string },
  userId: string,
  userRole: string,
  ipAddress?: string,
  userAgent?: string
) {
  // 1. Fetch current appointment
  const current = await db.appointment.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  const isAuthorized = 
    userRole === 'admin' || 
    userRole === 'clinic_admin' || 
    userRole === 'receptionist' ||
    current.patientId === userId ||
    current.doctorId === userId;

  if (!isAuthorized) {
    throw new Error('UNAUTHORIZED');
  }

  // 2. Perform DB update
  const updated = await db.appointment.update({
    where: { id },
    data: {
      dateTime: data.date_time ? new Date(data.date_time) : undefined,
      durationMinutes: data.duration_minutes !== undefined ? data.duration_minutes : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true } },
      clinic: true,
    },
  });

  // 3. Create Audit Log
  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'appointment',
    entityId: id,
    details: JSON.stringify({
      message: 'Appointment updated/rescheduled',
      changes: data,
    }),
    ipAddress,
    userAgent,
  });

  // Trigger notifications on reschedule
  if (data.date_time) {
    try {
      const dateStr = formatDateTimeNI(updated.dateTime);
      notifyAppointmentRescheduled(updated.patientId, updated.doctor?.name || 'Médico', dateStr).catch(err => console.error(err));
    } catch (err) {
      console.error('Failed to dispatch reschedule notification:', err);
    }
  }

  return updated;
}

