// OASIS - Appointment Service
// CRUD and status management for appointments

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

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
  } else {
    // admin, receptionist, pharmacy_manager see based on filters
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
  }

  if (filters.clinicId) where.clinicId = filters.clinicId;
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
  const appointment = await db.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctor_id,
      clinicId: data.clinic_id,
      dateTime: new Date(data.date_time),
      durationMinutes: data.duration_minutes || 30,
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

  return updated;
}
