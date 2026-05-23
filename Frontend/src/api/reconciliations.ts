// OASIS - Cash Reconciliation API Client
// Handles api calls for cashier settlements, system summaries, and history

import { get, post } from './client';

export interface CashSummary {
  entityId: string;
  entityType: 'clinic' | 'pharmacy';
  date: string;
  expectedCash: number;
  expectedCard: number;
  expectedTotal: number;
  salesCount: number;
}

export interface ReconciliationRecord {
  id: string;
  auditId?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  entityId: string;
  entityType: 'clinic' | 'pharmacy';
  reconciledBy: string;
  date: string;
  openingBalance: number;
  systemExpected: {
    cash: number;
    card: number;
    totalSales: number;
    totalExpectedDrawerCash: number;
  };
  actualDeclared: {
    cash: number;
    card: number;
    total: number;
  };
  discrepancies: {
    cash: number;
    card: number;
    total: number;
  };
  status: 'conciliated' | 'surplus' | 'deficit';
  notes: string;
  digitalSettleStamp: string;
}

/**
 * Calculates live system totals for the drawer settlement
 */
export async function getReconciliationSummary(
  entityId: string,
  type: 'clinics' | 'pharmacies'
): Promise<CashSummary> {
  const result = await get<CashSummary>(`/${type}/${entityId}/reconciliations/summary`);
  return result.data;
}

/**
 * Commits a cash reconciliation balance sheet
 */
export async function createReconciliation(
  entityId: string,
  type: 'clinics' | 'pharmacies',
  data: {
    openingBalance: number;
    actualCash: number;
    actualCard: number;
    notes?: string;
  }
): Promise<ReconciliationRecord> {
  const result = await post<ReconciliationRecord>(`/${type}/${entityId}/reconciliations`, data);
  return result.data;
}

/**
 * Retrieves historical reconciliation records
 */
export async function getReconciliationHistory(
  entityId: string,
  type: 'clinics' | 'pharmacies'
): Promise<ReconciliationRecord[]> {
  const result = await get<ReconciliationRecord[]>(`/${type}/${entityId}/reconciliations`);
  return result.data;
}
