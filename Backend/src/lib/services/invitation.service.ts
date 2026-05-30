// OASIS - Workers and Invitation Service
// Business logic for staff recruitment and invitations management

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createAuditLog } from './audit.service';
import crypto from 'crypto';

/**
 * Create an employee directly (Doctor, Receptionist, Cashier, Driver) without invitation flow
 */
export async function createEmployeeDirectly(
  senderId: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role: 'doctor' | 'receptionist' | 'cashier' | 'delivery_driver';
    clinicId?: string;
    pharmacyId?: string;
    specialty?: string;
    licenseNumber?: string;
    vehicleType?: string;
    licensePlate?: string;
  },
  ipAddress?: string,
  userAgent?: string
) {
  // Validate sender role and permissions
  const sender = await db.user.findUnique({ where: { id: senderId } });
  if (!sender) {
    throw new Error('SENDER_NOT_FOUND');
  }

  const { name, email, phone, password, role, clinicId, pharmacyId, specialty, licenseNumber, vehicleType, licensePlate } = data;

  if (sender.role === 'clinic_admin') {
    if (role !== 'doctor' && role !== 'receptionist') {
      throw new Error('INVALID_ROLE_FOR_CLINIC');
    }
    if (!clinicId) {
      throw new Error('CLINIC_ID_REQUIRED');
    }
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic || clinic.ownerId !== senderId) {
      throw new Error('FORBIDDEN_CLINIC');
    }
  } else if (sender.role === 'pharmacy_admin') {
    if (role !== 'cashier' && role !== 'delivery_driver') {
      throw new Error('INVALID_ROLE_FOR_PHARMACY');
    }
    if (!pharmacyId) {
      throw new Error('PHARMACY_ID_REQUIRED');
    }
    const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy || pharmacy.ownerId !== senderId) {
      throw new Error('FORBIDDEN_PHARMACY');
    }
  } else {
    throw new Error('UNAUTHORIZED_SENDER');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new Error('EMAIL_ALREADY_REGISTERED');
  }

  // Hash default or supplied password
  const pass = password || 'OasisNicaragua2026.';
  const passwordHash = await hashPassword(pass);

  // 14 days compliance deadline for employee documents submission
  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        emailVerified: true,
        verificationStatus: 'pending', // Starts pending to upload documents
        verificationDeadline: deadline,
      }
    });

    if (role === 'doctor') {
      await tx.doctorProfile.create({
        data: {
          userId: user.id,
          clinicId: clinicId!,
          specialty: specialty || 'Medicina General',
          licenseNumber: licenseNumber || `MINSA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        }
      });
    } else if (role === 'receptionist') {
      await tx.receptionistProfile.create({
        data: {
          userId: user.id,
          clinicId: clinicId || null,
        }
      });
    } else if (role === 'cashier') {
      await tx.pharmacyManagerProfile.create({
        data: {
          userId: user.id,
          pharmacyId: pharmacyId || null,
        }
      });
    } else if (role === 'delivery_driver') {
      await tx.deliveryDriverProfile.create({
        data: {
          userId: user.id,
          pharmacyId: pharmacyId!,
          vehicleType: vehicleType || 'motocicleta',
          licensePlate: licensePlate || null,
          isAvailable: true,
          employmentType: 'contractor',
        }
      });
    }

    // Create Audit Log
    await createAuditLog({
      userId: senderId,
      action: 'CREATE_EMPLOYEE',
      entityType: 'User',
      entityId: user.id,
      details: `Created employee ${name} with role ${role} directly`,
      ipAddress,
      userAgent
    }, tx);

    return user;
  });

  return result;
}

/**
 * Send an invitation to a worker
 */
export async function inviteWorker(
  senderId: string,
  email: string,
  role: 'doctor' | 'receptionist' | 'cashier' | 'delivery_driver',
  clinicId?: string,
  pharmacyId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Validate sender role and permissions
  const sender = await db.user.findUnique({ where: { id: senderId } });
  if (!sender) {
    throw new Error('SENDER_NOT_FOUND');
  }

  if (sender.role === 'clinic_admin') {
    if (role !== 'doctor' && role !== 'receptionist') {
      throw new Error('INVALID_ROLE_FOR_CLINIC');
    }
    if (!clinicId) {
      throw new Error('CLINIC_ID_REQUIRED');
    }
    // Verify clinic belongs to owner
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic || clinic.ownerId !== senderId) {
      throw new Error('FORBIDDEN_CLINIC');
    }
  } else if (sender.role === 'pharmacy_admin') {
    if (role !== 'cashier' && role !== 'delivery_driver') {
      throw new Error('INVALID_ROLE_FOR_PHARMACY');
    }
    if (!pharmacyId) {
      throw new Error('PHARMACY_ID_REQUIRED');
    }
    // Verify pharmacy belongs to owner
    const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy || pharmacy.ownerId !== senderId) {
      throw new Error('FORBIDDEN_PHARMACY');
    }
  } else {
    throw new Error('UNAUTHORIZED_SENDER');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new Error('EMAIL_ALREADY_REGISTERED');
  }

  // Generate invite token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

  // Create invitation record in transaction
  const invitation = await db.invitation.create({
    data: {
      email: normalizedEmail,
      role,
      token,
      expiresAt,
      senderId,
      clinicId: clinicId || null,
      pharmacyId: pharmacyId || null,
    },
  });

  // Log in audit log
  await createAuditLog({
    userId: senderId,
    action: 'create',
    entityType: 'invitation',
    entityId: invitation.id,
    details: JSON.stringify({ email: normalizedEmail, role, clinicId, pharmacyId }),
    ipAddress,
    userAgent,
  });

  return invitation;
}

/**
 * Get details of an active invitation
 */
export async function getInvitationByToken(token: string) {
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      clinic: { select: { name: true } },
      pharmacy: { select: { name: true } },
    },
  });

  if (!invitation) {
    throw new Error('INVITATION_NOT_FOUND');
  }

  if (invitation.isAccepted) {
    throw new Error('INVITATION_ALREADY_ACCEPTED');
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error('INVITATION_EXPIRED');
  }

  return invitation;
}

/**
 * Accept worker invitation and activate account
 */
export async function acceptInvitation(
  token: string,
  name: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
) {
  const invitation = await getInvitationByToken(token);

  // Hash password
  const passwordHash = await hashPassword(password);

  // Use transaction to create user, profile and mark invitation as accepted
  const result = await db.$transaction(async (tx) => {
    // 1. Create the base User
    const user = await tx.user.create({
      data: {
        name,
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        isActive: true,
        emailVerified: true,
      },
    });

    // 2. Create the role-specific profile and handle association
    if (invitation.role === 'doctor') {
      // Create Doctor profile
      await tx.doctorProfile.create({
        data: {
          userId: user.id,
          clinicId: invitation.clinicId!,
          licenseNumber: `MED-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, // Generate random license
          specialty: 'Medicina General',
        },
      });
    } else if (invitation.role === 'receptionist') {
      // Create Receptionist profile
      await tx.receptionistProfile.create({
        data: {
          userId: user.id,
          clinicId: invitation.clinicId!,
        },
      });
    } else if (invitation.role === 'cashier') {
      // In this database structure, cashier is modeled as a PharmacyManagerProfile
      await tx.pharmacyManagerProfile.create({
        data: {
          userId: user.id,
          pharmacyId: invitation.pharmacyId!,
        },
      });
    } else if (invitation.role === 'delivery_driver') {
      // Create Delivery Driver profile
      await tx.deliveryDriverProfile.create({
        data: {
          userId: user.id,
          pharmacyId: invitation.pharmacyId!,
          vehicleType: 'motocicleta',
          employmentType: 'employee',
        },
      });
    } else if (invitation.role === 'clinic_admin') {
      // Update clinic ownership if needed
      if (invitation.clinicId) {
        await tx.clinic.update({
          where: { id: invitation.clinicId },
          data: { ownerId: user.id }
        });
      }
    } else if (invitation.role === 'pharmacy_admin') {
      // Create Pharmacy Manager profile
      await tx.pharmacyManagerProfile.create({
        data: {
          userId: user.id,
          pharmacyId: invitation.pharmacyId!,
        },
      });
      // Update pharmacy ownership if needed
      if (invitation.pharmacyId) {
        await tx.pharmacy.update({
          where: { id: invitation.pharmacyId },
          data: { ownerId: user.id }
        });
      }
    }

    // 3. Mark the invitation as accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { isAccepted: true },
    });

    // 4. Trigger in-app notifications to admins
    if (invitation.role === 'doctor' || invitation.role === 'receptionist') {
      if (invitation.clinicId) {
        const { notifyInvitationAccepted } = require('./event-notifications');
        notifyInvitationAccepted(invitation.clinicId, name, invitation.role).catch((err: any) => console.error(err));
      }
    } else if (invitation.role === 'cashier' || invitation.role === 'delivery_driver') {
      if (invitation.pharmacyId) {
        const { notifyPharmacyInvitationAccepted } = require('./event-notifications');
        notifyPharmacyInvitationAccepted(invitation.pharmacyId, name, invitation.role).catch((err: any) => console.error(err));
      }
    }

    return user;
  });

  // Log in audit log
  await createAuditLog({
    userId: result.id,
    action: 'create',
    entityType: 'user',
    entityId: result.id,
    details: JSON.stringify({ action: 'accept_invitation', role: invitation.role }),
    ipAddress,
    userAgent,
  });

  return {
    id: result.id,
    email: result.email,
    name: result.name,
    role: result.role,
  };
}

/**
 * List workers for a clinic
 */
export async function getClinicWorkers(clinicId: string, ownerId: string, callerRole: string = 'clinic_admin') {
  // Verify clinic ownership (Superadmin bypasses)
  const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic || (callerRole !== 'admin' && clinic.ownerId !== ownerId)) {
    throw new Error('FORBIDDEN');
  }

  // OAS-009: Fetch doctors and receptionists in parallel using Promise.all to avoid blocking sequential requests
  const [doctors, receptionists] = await Promise.all([
    db.user.findMany({
      where: {
        role: 'doctor',
        doctorProfile: { clinicId },
      },
      include: {
        doctorProfile: true,
      },
      orderBy: { name: 'asc' },
    }),
    db.user.findMany({
      where: {
        role: 'receptionist',
        receptionistProfile: { clinicId },
      },
      include: {
        receptionistProfile: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    doctors: doctors.map(({ passwordHash, ...rest }) => rest),
    receptionists: receptionists.map(({ passwordHash, ...rest }) => rest),
  };
}

/**
 * List workers for a pharmacy
 */
export async function getPharmacyWorkers(pharmacyId: string, ownerId: string, callerRole: string = 'pharmacy_admin') {
  // Verify pharmacy ownership (Superadmin bypasses)
  const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
  if (!pharmacy || (callerRole !== 'admin' && pharmacy.ownerId !== ownerId)) {
    throw new Error('FORBIDDEN');
  }

  // OAS-009: Fetch cashiers and delivery drivers in parallel using Promise.all to avoid blocking sequential requests
  const [cashiers, drivers] = await Promise.all([
    db.user.findMany({
      where: {
        role: 'cashier',
        pharmacyManagerProfile: { pharmacyId },
      },
      include: {
        pharmacyManagerProfile: true,
      },
      orderBy: { name: 'asc' },
    }),
    db.user.findMany({
      where: {
        role: 'delivery_driver',
        deliveryDriverProfile: { pharmacyId },
      },
      include: {
        deliveryDriverProfile: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    cashiers: cashiers.map(({ passwordHash, ...rest }) => rest),
    drivers: drivers.map(({ passwordHash, ...rest }) => rest),
  };
}

/**
 * Enable/Disable a worker account
 */
export async function changeWorkerStatus(
  workerId: string,
  isActive: boolean,
  ownerId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Fetch worker user
  const worker = await db.user.findUnique({
    where: { id: workerId },
    include: {
      doctorProfile: true,
      receptionistProfile: true,
      pharmacyManagerProfile: true,
      deliveryDriverProfile: true,
    },
  });

  if (!worker) {
    throw new Error('WORKER_NOT_FOUND');
  }

  // Fetch caller details
  const caller = await db.user.findUnique({ where: { id: ownerId } });
  if (!caller) {
    throw new Error('CALLER_NOT_FOUND');
  }
  const isSuperAdmin = caller.role === 'admin';

  if (!isSuperAdmin) {
    // Verify ownership permission
    if (worker.role === 'doctor' || worker.role === 'receptionist') {
      const clinicId = worker.doctorProfile?.clinicId || worker.receptionistProfile?.clinicId;
      if (!clinicId) {
        throw new Error('NO_CLINIC_ASSOCIATION');
      }
      const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic || clinic.ownerId !== ownerId) {
        throw new Error('FORBIDDEN');
      }
    } else if (worker.role === 'cashier') {
      const pharmacyId = worker.pharmacyManagerProfile?.pharmacyId;
      if (!pharmacyId) {
        throw new Error('NO_PHARMACY_ASSOCIATION');
      }
      const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
      if (!pharmacy || pharmacy.ownerId !== ownerId) {
        throw new Error('FORBIDDEN');
      }
    } else if (worker.role === 'delivery_driver') {
      if (caller.role !== 'pharmacy_admin' && caller.role !== 'pharmacy_owner') {
        throw new Error('FORBIDDEN');
      }
      const pharmacyId = worker.deliveryDriverProfile?.pharmacyId;
      if (pharmacyId) {
        const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy || pharmacy.ownerId !== ownerId) {
          throw new Error('FORBIDDEN');
        }
      }
    } else {
      throw new Error('CANNOT_MODIFY_ROLE');
    }
  }

  // Update status
  const updated = await db.user.update({
    where: { id: workerId },
    data: { isActive },
  });

  // Log in audit log
  await createAuditLog({
    userId: ownerId,
    action: 'update',
    entityType: 'user',
    entityId: workerId,
    details: JSON.stringify({ action: 'change_worker_status', isActive }),
    ipAddress,
    userAgent,
  });

  const { passwordHash, ...rest } = updated;
  return rest;
}

/**
 * Update worker details with proper permission checks (anti-spoofing)
 */
export async function updateWorkerDetails(
  workerId: string,
  ownerId: string,
  data: {
    name?: string;
    phone?: string;
    specialty?: string;
    licenseNumber?: string;
    vehicleType?: string;
    licensePlate?: string;
  },
  ipAddress?: string,
  userAgent?: string
) {
  // Fetch worker user
  const worker = await db.user.findUnique({
    where: { id: workerId },
    include: {
      doctorProfile: true,
      receptionistProfile: true,
      pharmacyManagerProfile: true,
      deliveryDriverProfile: true,
    },
  });

  if (!worker) {
    throw new Error('WORKER_NOT_FOUND');
  }

  // Fetch caller details
  const caller = await db.user.findUnique({ where: { id: ownerId } });
  if (!caller) {
    throw new Error('CALLER_NOT_FOUND');
  }
  const isSuperAdmin = caller.role === 'admin';

  if (!isSuperAdmin) {
    // Verify ownership permission (anti-spoofing)
    if (worker.role === 'doctor' || worker.role === 'receptionist') {
      const clinicId = worker.doctorProfile?.clinicId || worker.receptionistProfile?.clinicId;
      if (!clinicId) {
        throw new Error('NO_CLINIC_ASSOCIATION');
      }
      const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic || clinic.ownerId !== ownerId) {
        throw new Error('FORBIDDEN');
      }
    } else if (worker.role === 'cashier') {
      const pharmacyId = worker.pharmacyManagerProfile?.pharmacyId;
      if (!pharmacyId) {
        throw new Error('NO_PHARMACY_ASSOCIATION');
      }
      const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
      if (!pharmacy || pharmacy.ownerId !== ownerId) {
        throw new Error('FORBIDDEN');
      }
    } else if (worker.role === 'delivery_driver') {
      if (caller.role !== 'pharmacy_admin' && caller.role !== 'pharmacy_owner') {
        throw new Error('FORBIDDEN');
      }
      const pharmacyId = worker.deliveryDriverProfile?.pharmacyId;
      if (pharmacyId) {
        const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy || pharmacy.ownerId !== ownerId) {
          throw new Error('FORBIDDEN');
        }
      }
    } else {
      throw new Error('CANNOT_MODIFY_ROLE');
    }
  }

  // Perform updates in a transaction
  const result = await db.$transaction(async (tx) => {
    // 1. Update base User table
    const userUpdates: any = {};
    if (data.name !== undefined) userUpdates.name = data.name;
    if (data.phone !== undefined) userUpdates.phone = data.phone;

    const updatedUser = await tx.user.update({
      where: { id: workerId },
      data: userUpdates,
    });

    // 2. Update role-specific profile
    if (worker.role === 'doctor' && worker.doctorProfile) {
      const docUpdates: any = {};
      if (data.specialty !== undefined) docUpdates.specialty = data.specialty;
      if (data.licenseNumber !== undefined) docUpdates.licenseNumber = data.licenseNumber;

      if (Object.keys(docUpdates).length > 0) {
        await tx.doctorProfile.update({
          where: { userId: workerId },
          data: docUpdates,
        });
      }
    } else if (worker.role === 'delivery_driver' && worker.deliveryDriverProfile) {
      const driverUpdates: any = {};
      if (data.vehicleType !== undefined) driverUpdates.vehicleType = data.vehicleType;
      if (data.licensePlate !== undefined) driverUpdates.licensePlate = data.licensePlate;

      if (Object.keys(driverUpdates).length > 0) {
        await tx.deliveryDriverProfile.update({
          where: { userId: workerId },
          data: driverUpdates,
        });
      }
    }

    return updatedUser;
  });

  // Log in audit log
  await createAuditLog({
    userId: ownerId,
    action: 'update',
    entityType: 'user',
    entityId: workerId,
    details: `Updated worker ${workerId} details: ${JSON.stringify(data)}`,
    ipAddress,
    userAgent,
  });

  const { passwordHash, ...rest } = result;
  return rest;
}
