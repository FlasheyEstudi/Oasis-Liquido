// ============================================
// OASIS - Admin API Service
// GET /admin/stats
// GET /admin/audit-logs
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get } from './client';
import type {
  AdminStats,
  AuditLog,
  PaginatedResponse,
} from '@/types';

export interface AdminStatsParams {
  clinic_id?: string;
  pharmacy_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface AuditLogListParams {
  user_id?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  page?: number;
  limit?: number;
}

/** Get admin dashboard statistics */
export async function getStats(params?: AdminStatsParams): Promise<AdminStats> {
  const result = await get<AdminStats>('/admin/stats', params as Record<string, unknown>);
  return result.data;
}

/** Get audit logs with optional filters */
export async function getAuditLogs(params?: AuditLogListParams): Promise<PaginatedResponse<AuditLog>> {
  return get<AuditLog[]>('/admin/audit-logs', params as Record<string, unknown>) as Promise<PaginatedResponse<AuditLog>>;
}
