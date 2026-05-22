// OASIS - Family Service
// Business logic for patient-caregiver relationships

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

/**
 * Get all family relationships for a user (either caregiver or patient)
 */
export async function getFamilyRelationships(userId: string) {
  const [caregiverFor, patientOf] = await Promise.all([
    db.familyRelationship.findMany({
      where: { caregiverId: userId, isActive: true },
      include: {
        patient: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            patientProfile: true,
          },
        },
      },
    }),
    db.familyRelationship.findMany({
      where: { patientId: userId, isActive: true },
      include: {
        caregiver: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  return {
    caregiverFor: caregiverFor.map(r => ({
      id: r.id,
      patient_id: r.patientId,
      relationship: r.relationship,
      isActive: r.isActive,
      createdAt: r.createdAt,
      patient: {
        id: r.patient.id,
        email: r.patient.email,
        name: r.patient.name,
        phone: r.patient.phone,
        profile: r.patient.patientProfile,
      },
    })),
    patientOf: patientOf.map(r => ({
      id: r.id,
      caregiver_id: r.caregiverId,
      relationship: r.relationship,
      isActive: r.isActive,
      createdAt: r.createdAt,
      caregiver: r.caregiver,
    })),
  };
}

/**
 * Link a caregiver to a patient via the patient's email
 */
export async function createFamilyRelationship(
  caregiverId: string,
  patientEmail: string,
  relationship: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Find the patient
  const patient = await db.user.findUnique({
    where: { email: patientEmail.trim().toLowerCase() },
  });

  if (!patient) {
    throw new Error('PATIENT_NOT_FOUND');
  }

  if (patient.id === caregiverId) {
    throw new Error('CANNOT_LINK_SELF');
  }

  // Check if relation already exists
  const existing = await db.familyRelationship.findUnique({
    where: {
      caregiverId_patientId: {
        caregiverId,
        patientId: patient.id,
      },
    },
  });

  if (existing) {
    if (existing.isActive) {
      throw new Error('RELATIONSHIP_ALREADY_EXISTS');
    }
    // Reactivate existing relationship
    const updated = await db.familyRelationship.update({
      where: { id: existing.id },
      data: { isActive: true, relationship },
    });
    return updated;
  }

  // Create new relationship
  const newRelation = await db.familyRelationship.create({
    data: {
      caregiverId,
      patientId: patient.id,
      relationship,
    },
  });

  // Audit log
  await createAuditLog({
    userId: caregiverId,
    action: 'create',
    entityType: 'family_relationship',
    entityId: newRelation.id,
    details: JSON.stringify({ patientId: patient.id, relationship }),
    ipAddress,
    userAgent,
  });

  return newRelation;
}

/**
 * Remove/Deactivate a family relationship
 */
export async function deleteFamilyRelationship(
  caregiverId: string,
  relationshipId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const existing = await db.familyRelationship.findFirst({
    where: {
      id: relationshipId,
      caregiverId,
    },
  });

  if (!existing) {
    throw new Error('RELATIONSHIP_NOT_FOUND');
  }

  const deleted = await db.familyRelationship.update({
    where: { id: relationshipId },
    data: { isActive: false },
  });

  // Audit log
  await createAuditLog({
    userId: caregiverId,
    action: 'delete',
    entityType: 'family_relationship',
    entityId: relationshipId,
    ipAddress,
    userAgent,
  });

  return deleted;
}
