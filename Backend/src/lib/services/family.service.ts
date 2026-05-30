// OASIS - Family Service
// Business logic for patient-caregiver relationships with verification codes
import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';
import * as crypto from 'crypto';

/**
 * Get all active or pending family relationships for a user (either caregiver or patient)
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
      status: r.status,
      permissions: r.permissions,
      isActive: r.isActive,
      verificationCode: r.verificationCode,
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
      status: r.status,
      permissions: r.permissions,
      isActive: r.isActive,
      verificationCode: r.verificationCode,
      createdAt: r.createdAt,
      caregiver: r.caregiver,
    })),
  };
}

/**
 * Request a family link (Supervisor/Caregiver requests to link a Dependent/Patient)
 * Generates a unique 6-digit code valid for 24 hours.
 */
export async function requestFamilyLink(
  initiatorId: string,
  targetEmail: string,
  relationship: string,
  permissions: string[] = ['view_health_data', 'buy_medicines', 'schedule_appointments'],
  ipAddress?: string,
  userAgent?: string
) {
  const initiator = await db.user.findUnique({
    where: { id: initiatorId },
  });

  if (!initiator) {
    throw new Error('INITIATOR_NOT_FOUND');
  }

  const targetUser = await db.user.findUnique({
    where: { email: targetEmail.trim().toLowerCase() },
  });

  if (!targetUser) {
    throw new Error('PATIENT_NOT_FOUND'); // Mapped to existing error for API consistency
  }

  if (targetUser.id === initiatorId) {
    throw new Error('CANNOT_LINK_SELF');
  }

  // Determine role roles dynamically
  let caregiverId: string;
  let patientId: string;

  if (initiator.role === 'patient') {
    // Patient initiates: Patient wants to link a Caregiver (Supervisor)
    patientId = initiatorId;
    caregiverId = targetUser.id;
  } else {
    // Caregiver/Supervisor initiates: Caregiver wants to link a Patient (Dependent)
    caregiverId = initiatorId;
    patientId = targetUser.id;
  }

  // Generate 6-digit code
  const verificationCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const codeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Check if a relationship already exists (active or inactive)
  const existing = await db.familyRelationship.findUnique({
    where: {
      caregiverId_patientId: {
        caregiverId,
        patientId,
      },
    },
  });

  let relation;
  if (existing) {
    relation = await db.familyRelationship.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        status: 'pending',
        relationship,
        verificationCode,
        codeExpiresAt,
        permissions,
      },
    });
  } else {
    relation = await db.familyRelationship.create({
      data: {
        caregiverId,
        patientId,
        relationship,
        status: 'pending',
        verificationCode,
        codeExpiresAt,
        permissions,
        isActive: true,
      },
    });
  }

  // Audit log
  await createAuditLog({
    userId: initiatorId,
    action: 'create',
    entityType: 'family_relationship',
    entityId: relation.id,
    details: JSON.stringify({ patientId, caregiverId, relationship, status: 'pending' }),
    ipAddress,
    userAgent,
  });

  // Mock sending email to user - in a real scenario we'd use notification service
  console.log(`✉️ Sending family link code ${verificationCode} to target ${targetEmail}`);

  return {
    relation,
    verificationCode,
    expiresAt: codeExpiresAt,
    patientName: initiator.role === 'patient' ? targetUser.name : initiator.name,
  };
}

/**
 * Verify a family link (Dependent/Patient enters the 6-digit code to complete the link)
 */
export async function verifyFamilyLink(
  patientId: string,
  code: string,
  ipAddress?: string,
  userAgent?: string
) {
  // OAS-006: Find a pending relationship with this code where the current user is either patient or caregiver
  const relation = await db.familyRelationship.findFirst({
    where: {
      verificationCode: code.trim(),
      status: 'pending',
      isActive: true,
      OR: [
        { patientId: patientId },
        { caregiverId: patientId },
      ],
    },
    include: {
      caregiver: {
        select: {
          name: true,
          email: true,
        },
      },
      patient: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!relation) {
    throw new Error('INVALID_CODE');
  }

  if (relation.codeExpiresAt && new Date() > relation.codeExpiresAt) {
    throw new Error('CODE_EXPIRED');
  }

  // Activate the relationship
  const updated = await db.familyRelationship.update({
    where: { id: relation.id },
    data: {
      status: 'active',
      verificationCode: null,
      codeExpiresAt: null,
    },
  });

  // Audit log
  await createAuditLog({
    userId: patientId,
    action: 'update',
    entityType: 'family_relationship',
    entityId: relation.id,
    details: JSON.stringify({ caregiverId: relation.caregiverId, status: 'active' }),
    ipAddress,
    userAgent,
  });

  // Dynamically assign names based on who accepted the link
  const isUserCaregiver = relation.caregiverId === patientId;
  const supervisorName = isUserCaregiver ? relation.patient.name : relation.caregiver.name;
  const supervisorEmail = isUserCaregiver ? relation.patient.email : relation.caregiver.email;

  return {
    relation: updated,
    supervisorName,
    supervisorEmail,
  };
}

/**
 * Update permissions for a family relationship
 */
export async function updateFamilyPermissions(
  caregiverId: string,
  relationshipId: string,
  permissions: string[],
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

  const updated = await db.familyRelationship.update({
    where: { id: relationshipId },
    data: { permissions },
  });

  // Audit log
  await createAuditLog({
    userId: caregiverId,
    action: 'update',
    entityType: 'family_relationship',
    entityId: relationshipId,
    details: JSON.stringify({ updated: 'permissions', permissions }),
    ipAddress,
    userAgent,
  });

  return updated;
}

/**
 * Remove or deactivate a family relationship
 */
export async function deleteFamilyRelationship(
  userId: string, // Can be caregiver OR patient
  relationshipId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const existing = await db.familyRelationship.findFirst({
    where: {
      id: relationshipId,
      OR: [
        { caregiverId: userId },
        { patientId: userId },
      ],
    },
  });

  if (!existing) {
    throw new Error('RELATIONSHIP_NOT_FOUND');
  }

  const deleted = await db.familyRelationship.update({
    where: { id: relationshipId },
    data: { isActive: false, status: 'rejected' },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: 'delete',
    entityType: 'family_relationship',
    entityId: relationshipId,
    ipAddress,
    userAgent,
  });

  return deleted;
}
