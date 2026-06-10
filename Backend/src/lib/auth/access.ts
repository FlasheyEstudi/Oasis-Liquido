import { db } from '@/lib/db';

/**
 * Verifies if a user has access to a specific clinic or pharmacy.
 * @param userId - ID of the calling user
 * @param role - Role of the calling user
 * @param facilityId - ID of the target clinic or pharmacy
 * @param type - Type of facility: 'clinic' or 'pharmacy'
 */
export async function verifyFacilityAccess(
  userId: string,
  role: string,
  facilityId: string,
  type: 'clinic' | 'pharmacy'
): Promise<boolean> {
  if (role === 'admin') {
    return true; // Super Admin has bypass access to all facilities
  }

  if (type === 'clinic') {
    if (role === 'clinic_admin') {
      const clinic = await db.clinic.findUnique({
        where: { id: facilityId },
      });
      return clinic?.ownerId === userId;
    }
    
    if (role === 'doctor') {
      const profile = await db.doctorProfile.findUnique({
        where: { userId },
      });
      return profile?.clinicId === facilityId;
    }

    if (role === 'receptionist') {
      const profile = await db.receptionistProfile.findUnique({
        where: { userId },
      });
      return profile?.clinicId === facilityId;
    }
  }

  if (type === 'pharmacy') {
    if (role === 'pharmacy_admin') {
      const pharmacy = await db.pharmacy.findUnique({
        where: { id: facilityId },
      });
      return pharmacy?.ownerId === userId;
    }

    if (role === 'pharmacy_manager' || role === 'cashier') {
      const profile = await db.pharmacyManagerProfile.findUnique({
        where: { userId },
      });
      return profile?.pharmacyId === facilityId;
    }

    if (role === 'delivery_driver') {
      const profile = await db.deliveryDriverProfile.findUnique({
        where: { userId },
      });
      return profile?.pharmacyId === facilityId;
    }
  }

  return false;
}
