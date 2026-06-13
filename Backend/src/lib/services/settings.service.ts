// =========================================================
// OASIS - Global Settings Service
// - Handles global system configurations (e.g. delivery fee, taxes)
// - Supports Superadmin actions with secure audit logging
// =========================================================

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

/**
 * Retrieve all global settings
 */
export async function getGlobalSettings() {
  return db.globalSetting.findMany({
    orderBy: { key: 'asc' }
  });
}

/**
 * Update a global setting by key (restricted to Superadmin in endpoint)
 */
export async function updateGlobalSetting(
  key: string,
  value: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // 1. Fetch current setting to log changes
  const current = await db.globalSetting.findUnique({
    where: { key }
  });

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  // Validation for critical financial keys to prevent NaN or negative settings
  const numericKeys = ['USD_EXCHANGE_RATE', 'default_vat_rate', 'delivery_fee_per_km', 'base_consultation_fee'];
  if (numericKeys.includes(key)) {
    const valNum = parseFloat(value);
    if (isNaN(valNum) || valNum < 0) {
      throw new Error('INVALID_VALUE: Value must be a non-negative number');
    }
  }

  // 2. Perform DB update
  const updated = await db.globalSetting.update({
    where: { key },
    data: { value }
  });

  // 3. Log action to Audit System
  await createAuditLog({
    userId,
    action: 'update',
    entityType: 'global_setting',
    entityId: key,
    details: JSON.stringify({
      field: 'value',
      from: current.value,
      to: value
    }),
    ipAddress,
    userAgent
  });

  return updated;
}
