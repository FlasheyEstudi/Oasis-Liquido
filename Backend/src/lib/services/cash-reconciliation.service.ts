// OASIS - Cash Reconciliation and Drawer Settlement Service
// Handles daily cash register balancing, expected sales totals, and secure audit tracking

import { db } from '@/lib/db';
import { createAuditLog } from './audit.service';

export interface CashSummary {
  entityId: string;
  entityType: 'clinic' | 'pharmacy';
  date: string;
  expectedCash: number;
  expectedCard: number;
  expectedTotal: number;
  salesCount: number;
}

/**
 * Resolves the global USD Exchange Rate (NIO per USD) from configurations
 */
export async function getUsdExchangeRate(): Promise<number> {
  try {
    const rateSetting = await db.globalSetting.findUnique({
      where: { key: 'USD_EXCHANGE_RATE' },
    });
    if (rateSetting && rateSetting.value) {
      const rate = parseFloat(rateSetting.value);
      if (!isNaN(rate) && rate > 0) {
        return rate;
      }
    }
  } catch (err) {
    console.error('Error fetching USD_EXCHANGE_RATE setting:', err);
  }
  return 36.6; // Nicaragua default exchange rate baseline
}

/**
 * Calculates the expected cash and card sales totals for today (or a specific date)
 */
export async function getCashSummary(
  entityId: string,
  entityType: 'clinic' | 'pharmacy',
  dateStr?: string
): Promise<CashSummary> {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  
  // Start and end of the target day in local/system time
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  // Find all completed sales for this entity today
  const sales = await db.sale.findMany({
    where: {
      clinicId: entityType === 'clinic' ? entityId : undefined,
      pharmacyId: entityType === 'pharmacy' ? entityId : undefined,
      status: 'completed',
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      payments: true,
    },
  });

  const exchangeRate = await getUsdExchangeRate();
  let expectedCash = 0;
  let expectedCard = 0;

  for (const sale of sales) {
    if (sale.payments && sale.payments.length > 0) {
      for (const pay of sale.payments) {
        if (pay.status === 'completed') {
          // Convert USD to NIO base currency
          const amountInNio = pay.currency === 'USD' ? pay.amount * exchangeRate : pay.amount;
          if (pay.method === 'cash') {
            expectedCash += amountInNio;
          } else {
            expectedCard += amountInNio;
          }
        }
      }
    } else {
      // Fallback: If no explicit payment records, count as cash (NIO base)
      expectedCash += sale.totalAmount;
    }
  }

  return {
    entityId,
    entityType,
    date: startOfDay.toISOString().split('T')[0],
    expectedCash: parseFloat(expectedCash.toFixed(2)),
    expectedCard: parseFloat(expectedCard.toFixed(2)),
    expectedTotal: parseFloat((expectedCash + expectedCard).toFixed(2)),
    salesCount: sales.length,
  };
}

/**
 * Commits a secure, immutable cash drawer reconciliation record to Audit Log
 */
export async function createCashReconciliation(
  userId: string,
  data: {
    entityId: string;
    entityType: 'clinic' | 'pharmacy';
    openingBalance: number;
    actualCash: number;
    actualCard: number;
    notes?: string;
  },
  ipAddress?: string,
  userAgent?: string
) {
  const { entityId, entityType, openingBalance, actualCash, actualCard, notes } = data;

  // Validate that all declared financial values are valid non-negative numbers
  if (
    isNaN(openingBalance) || isNaN(actualCash) || isNaN(actualCard) ||
    openingBalance < 0 || actualCash < 0 || actualCard < 0
  ) {
    throw new Error('INVALID_AMOUNTS: Balances and declared amounts must be non-negative numbers');
  }

  // 1. Get current expected numbers
  const summary = await getCashSummary(entityId, entityType);

  // 2. Compute discrepancies
  const totalSystemSales = summary.expectedCash + summary.expectedCard;
  const totalActualDeclared = actualCash + actualCard;
  
  // Discrepancy is actual cash declared vs what is expected (opening balance + expected cash)
  const expectedCashTotal = openingBalance + summary.expectedCash;
  const discrepancyCash = actualCash - expectedCashTotal;
  const discrepancyCard = actualCard - summary.expectedCard;
  const totalDiscrepancy = discrepancyCash + discrepancyCard;

  let reconciliationStatus = 'conciliated';
  if (totalDiscrepancy > 2) {
    reconciliationStatus = 'surplus'; // Sobrante
  } else if (totalDiscrepancy < -2) {
    reconciliationStatus = 'deficit'; // Faltante
  }

  // 3. Construct rich details JSON
  const reconciliationDetails = {
    entityId,
    entityType,
    reconciledBy: userId,
    date: summary.date,
    openingBalance,
    systemExpected: {
      cash: summary.expectedCash,
      card: summary.expectedCard,
      totalSales: totalSystemSales,
      totalExpectedDrawerCash: expectedCashTotal,
    },
    actualDeclared: {
      cash: actualCash,
      card: actualCard,
      total: totalActualDeclared,
    },
    discrepancies: {
      cash: parseFloat(discrepancyCash.toFixed(2)),
      card: parseFloat(discrepancyCard.toFixed(2)),
      total: parseFloat(totalDiscrepancy.toFixed(2)),
    },
    status: reconciliationStatus,
    notes: notes || '',
    digitalSettleStamp: `SETTLE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
  };

  // 4. Save to Audit Log as immutable record
  const audit = await createAuditLog({
    userId,
    action: 'CASH_DRAWER_SETTLE',
    entityType: entityType === 'clinic' ? 'Clinic' : 'Pharmacy',
    entityId: entityId,
    details: JSON.stringify(reconciliationDetails),
    ipAddress,
    userAgent,
  });

  return {
    id: audit.id,
    createdAt: audit.createdAt,
    ...reconciliationDetails,
  };
}

/**
 * Retrieves the historical reconciliation logs for an entity
 */
export async function getReconciliationHistory(
  entityId: string,
  entityType: 'clinic' | 'pharmacy'
) {
  const logs = await db.auditLog.findMany({
    where: {
      action: 'CASH_DRAWER_SETTLE',
      entityId: entityId,
      entityType: entityType === 'clinic' ? 'Clinic' : 'Pharmacy',
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return logs.map((log) => {
    let parsedDetails = {};
    try {
      if (log.details) {
        parsedDetails = JSON.parse(log.details);
      }
    } catch (e) {
      console.error('Failed to parse reconciliation details:', e);
    }

    return {
      auditId: log.id,
      createdAt: log.createdAt,
      user: log.user,
      ...parsedDetails,
    };
  });
}
