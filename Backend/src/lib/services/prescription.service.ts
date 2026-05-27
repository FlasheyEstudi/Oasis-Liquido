import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

function mapPrescription(presc: any) {
  if (!presc) return null;
  return {
    ...presc,
    patient_id: presc.patientId,
    doctor_id: presc.doctorId,
    clinic_id: presc.clinicId,
    appointment_id: presc.appointmentId,
    qr_code_data: presc.qrCode,
    issue_date: presc.issuedAt ? presc.issuedAt.toISOString() : undefined,
    expiration_date: presc.expirationDate,
    updated_at: presc.updatedAt ? presc.updatedAt.toISOString() : undefined,
    lines: presc.prescriptionLines ? presc.prescriptionLines.map((line: any) => ({
      ...line,
      id: line.id,
      prescription_id: line.prescriptionId,
      medicine_id: line.medicineId,
      quantity: line.quantity,
      quantity_fulfilled: line.quantityFulfilled,
      dosage_instructions: line.dosageInstructions,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
      medicine: line.medicine
    })) : undefined
  };
}

/**
 * Get prescriptions with role-based filtering
 */
export async function getPrescriptions(filters: {
  patientId?: string;
  doctorId?: string;
  status?: string;
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
    // pharmacy_manager, admin can see based on filters
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
  }

  if (filters.status) where.status = filters.status;

  const [data, total] = await Promise.all([
    db.prescription.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true, doctorProfile: true } },
        clinic: { select: { id: true, name: true } },
        prescriptionLines: { include: { medicine: true } },
      },
      orderBy: { issuedAt: 'desc' },
      skip: filters.skip,
      take: filters.limit,
    }),
    db.prescription.count({ where }),
  ]);

  return { data: data.map(mapPrescription), total };
}

/**
 * Get single prescription with full details
 */
export async function getPrescription(id: string) {
  const presc = await db.prescription.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, email: true, patientProfile: true } },
      doctor: { select: { id: true, name: true, doctorProfile: true } },
      clinic: { select: { id: true, name: true, address: true } },
      prescriptionLines: { include: { medicine: true } },
      fulfilledPharmacy: { select: { id: true, name: true } },
    },
  });
  return mapPrescription(presc);
}

/**
 * Create a new prescription (doctor only)
 */
export async function createPrescription(
  data: {
    patient_id: string;
    clinic_id: string;
    appointment_id?: string;
    expiration_date: string;
    notes?: string;
    signature_pin: string;
    lines: Array<{
      medicine_id: string;
      quantity: number;
      dosage_instructions: string;
    }>;
  },
  doctorId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // 1. Fetch Doctor Profile and User Verification Status
  const doctor = await db.user.findUnique({
    where: { id: doctorId },
    select: {
      verificationStatus: true,
      doctorProfile: true,
    },
  });

  if (!doctor || !doctor.doctorProfile) {
    throw new Error('DOCTOR_PROFILE_NOT_FOUND');
  }

  // Validate that doctor's medical accreditation is approved by MINSA
  if (doctor.verificationStatus !== 'approved') {
    throw new Error('DOCTOR_NOT_VERIFIED');
  }

  const doctorProfile = doctor.doctorProfile;

  const finalHashedPin = doctorProfile.signaturePin;

  // 2. Enforce pre-configured PIN signature
  if (!finalHashedPin) {
    throw new Error('PIN_NOT_CONFIGURED');
  }

  // 3. Verify PIN
  const isValid = await verifyPassword(data.signature_pin, finalHashedPin);
  if (!isValid) {
    throw new Error('INCORRECT_PIN');
  }

  // 4. Generate verification code & QR code
  const verificationCode = `RX-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const qrCode = verificationCode;

  // 5. Generate HMAC-SHA256 digital signature using the hashed PIN as the secret key
  const messageToSign = `${doctorId}|${data.patient_id}|${data.expiration_date}`;
  const digitalSignature = crypto
    .createHmac('sha256', finalHashedPin!)
    .update(messageToSign)
    .digest('hex');

  // 6. Create the signed prescription atomically
  const prescription = await db.prescription.create({
    data: {
      patientId: data.patient_id,
      doctorId,
      clinicId: data.clinic_id,
      appointmentId: data.appointment_id,
      qrCode,
      verificationCode,
      digitalSignature,
      status: 'active',
      notes: data.notes,
      expirationDate: data.expiration_date,
      prescriptionLines: {
        create: data.lines.map((line) => ({
          medicineId: line.medicine_id,
          quantity: line.quantity,
          dosageInstructions: line.dosage_instructions,
        })),
      },
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, doctorProfile: true } },
      clinic: true,
      prescriptionLines: { include: { medicine: true } },
    },
  });

  await createAuditLog({
    userId: doctorId,
    action: 'create',
    entityType: 'prescription',
    entityId: prescription.id,
    ipAddress,
    userAgent,
  });

  return mapPrescription(prescription);
}
/**
 * Update a prescription (only if draft)
 */
export async function updatePrescription(
  id: string,
  data: {
    expiration_date?: string;
    notes?: string;
    lines?: Array<{
      medicine_id: string;
      quantity: number;
      dosage_instructions: string;
    }>;
  },
  userId: string
) {
  const existing = await db.prescription.findUnique({
    where: { id },
  });

  if (!existing) throw new Error('NOT_FOUND');
  
  // CRITICAL: Prevent editing signed prescriptions
  if (existing.status !== 'draft') {
    throw new Error('SIGNED_PRESCRIPTION_CANNOT_BE_EDITED');
  }

  const updated = await db.prescription.update({
    where: { id },
    data: {
      expirationDate: data.expiration_date,
      notes: data.notes,
      prescriptionLines: data.lines ? {
        deleteMany: {},
        create: data.lines.map((line) => ({
          medicineId: line.medicine_id,
          quantity: line.quantity,
          dosageInstructions: line.dosage_instructions,
        })),
      } : undefined,
    },
    include: {
      prescriptionLines: { include: { medicine: true } },
    },
  });

  return mapPrescription(updated);
}

/**
 * Validate a prescription by QR code
 */
export async function validatePrescription(qrData: string) {
  let searchField: 'qrCode' | 'id' = 'qrCode';
  let searchValue = qrData.trim();

  // Smart URL parser for recipe verify strings
  if (searchValue.includes('verificar-receta-')) {
    const parts = searchValue.split('verificar-receta-');
    searchValue = parts[parts.length - 1];
    searchField = 'id';
  } else if (searchValue.includes('#prescription-')) {
    const parts = searchValue.split('#prescription-');
    searchValue = parts[parts.length - 1];
    searchField = 'id';
  } else if (searchValue.includes('verify-prescription-')) {
    const parts = searchValue.split('verify-prescription-');
    searchValue = parts[parts.length - 1];
    searchField = 'id';
  }

  const prescription = await db.prescription.findFirst({
    where: searchField === 'id' ? { id: searchValue } : { qrCode: searchValue },
    include: {
      patient: { select: { id: true, name: true, email: true, patientProfile: true } },
      doctor: { select: { id: true, name: true, doctorProfile: true } },
      clinic: true,
      prescriptionLines: { include: { medicine: true } },
    },
  });

  if (!prescription) {
    throw new Error('NOT_FOUND');
  }

  // Check if prescription is expired
  const now = new Date();
  const expDate = new Date(prescription.expirationDate);
  if (expDate < now || prescription.status === 'expired') {
    throw new Error('PRESCRIPTION_EXPIRED');
  }

  // Check if cancelled
  if (prescription.status === 'cancelled') {
    throw new Error('PRESCRIPTION_CANCELLED');
  }

  // Check if already fully fulfilled
  if (prescription.status === 'fulfilled') {
    throw new Error('PRESCRIPTION_FULFILLED');
  }

  return mapPrescription(prescription);
}

/**
 * Fulfill a prescription (dispense medicines)
 * Updates prescription lines, decrements inventory, updates prescription status
 * Uses $transaction for atomicity and validates pharmacy ownership
 */
export async function fulfillPrescription(
  prescriptionId: string,
  data: {
    pharmacy_id: string;
    items: Array<{
      prescription_line_id: string;
      quantity_fulfilled: number;
    }>;
  },
  userId: string,
  userPharmacyId?: string, // Added for validation
  ipAddress?: string,
  userAgent?: string
) {
  // 1. Validate ownership if user is pharmacy_manager
  if (userPharmacyId && userPharmacyId !== data.pharmacy_id) {
    throw new Error('FORBIDDEN: No tienes permisos para esta farmacia');
  }

  // 2. Start transaction
  return await db.$transaction(async (tx) => {
    // Validate that the pharmacy is active (not suspended by compliance/expirations)
    const pharmacy = await tx.pharmacy.findUnique({
      where: { id: data.pharmacy_id },
      select: { isActive: true },
    });

    if (!pharmacy) throw new Error('PHARMACY_NOT_FOUND');
    if (!pharmacy.isActive) {
      throw new Error('PHARMACY_SUSPENDED');
    }

    const prescription = await tx.prescription.findUnique({
      where: { id: prescriptionId },
      include: { prescriptionLines: true },
    });

    if (!prescription) throw new Error('NOT_FOUND');

    // Update each prescription line and inventory
    for (const item of data.items) {
      const line = prescription.prescriptionLines.find((l) => l.id === item.prescription_line_id);
      if (!line) continue;

      const newFulfilled = line.quantityFulfilled + item.quantity_fulfilled;
      if (newFulfilled > line.quantity) {
        throw new Error(`Cannot fulfill more than prescribed for line ${item.prescription_line_id}`);
      }

      // Update prescription line
      await tx.prescriptionLine.update({
        where: { id: item.prescription_line_id },
        data: { quantityFulfilled: newFulfilled },
      });

      // Decrement inventory atomically
      const inventoryItem = await tx.inventory.findFirst({
        where: {
          pharmacyId: data.pharmacy_id,
          medicineId: line.medicineId,
        },
      });

      if (!inventoryItem || inventoryItem.quantity < item.quantity_fulfilled) {
        throw new Error(`INSUFFICIENT_STOCK: ${line.medicineId}`);
      }

      await tx.inventory.update({
        where: { id: inventoryItem.id },
        data: { quantity: { decrement: item.quantity_fulfilled } },
      });
    }

    // Check if all lines are fully fulfilled
    const updatedLines = await tx.prescriptionLine.findMany({
      where: { prescriptionId },
    });

    const allFulfilled = updatedLines.every((l) => l.quantityFulfilled >= l.quantity);
    const anyFulfilled = updatedLines.some((l) => l.quantityFulfilled > 0);

    let newStatus = prescription.status;
    if (allFulfilled) {
      newStatus = 'fulfilled';
    } else if (anyFulfilled) {
      newStatus = 'partially_fulfilled';
    }

    // Update prescription
    const updated = await tx.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: newStatus,
        fulfilledAt: allFulfilled ? new Date() : undefined,
        fulfilledPharmacyId: data.pharmacy_id,
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true, doctorProfile: true } },
        prescriptionLines: { include: { medicine: true } },
        fulfilledPharmacy: { select: { id: true, name: true } },
      },
    });

    // Audit log (inside transaction or just after)
    await createAuditLog({
      userId,
      action: 'update',
      entityType: 'prescription',
      entityId: prescriptionId,
      details: JSON.stringify({ action: 'fulfill', pharmacy_id: data.pharmacy_id, items: data.items }),
      ipAddress,
      userAgent,
    });

    // Notify patient
    try {
      const { notifyPrescriptionFulfilled } = require('./event-notifications');
      notifyPrescriptionFulfilled(updated.patientId, updated.fulfilledPharmacy?.name || 'Farmacia').catch((err: any) => console.error(err));
    } catch (err) {
      console.error('Failed to trigger prescription fulfilled notification:', err);
    }

    return mapPrescription(updated);
  });
}
