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

/** Get Sankey conversion analytics flow */
export async function getSankeyData(): Promise<any> {
  const result = await get<any>('/admin/analytics/sankey');
  return result.data;
}

/** Get active nodes network map */
export async function getNetworkData(): Promise<any> {
  const result = await get<any>('/admin/analytics/network');
  return result.data;
}

/** Get daily heatmap calendar sales */
export async function getHeatmapData(): Promise<any> {
  const result = await get<any>('/admin/analytics/heatmap');
  return result.data;
}

/** Submit new beta feedback */
export async function submitBetaFeedback(data: { type: string; content: string; userId?: string }): Promise<any> {
  const { post } = await import('./client');
  const result = await post<any>('/feedback', data);
  return result.data;
}

/** Get all beta feedback submissions (admin) */
export async function getBetaFeedback(): Promise<any> {
  const result = await get<any>('/feedback');
  return result.data;
}

/** Update status of a beta feedback submission (admin) */
export async function updateBetaFeedbackStatus(id: string, status: string): Promise<any> {
  const { patch } = await import('./client');
  const result = await patch<any>('/feedback', { id, status });
  return result.data;
}

/** Get all global settings (admin) */
export async function getGlobalSettings(): Promise<any> {
  const result = await get<any>('/admin/settings');
  return result.data;
}

/** Update a specific global setting (admin) */
export async function updateGlobalSetting(key: string, value: string): Promise<any> {
  const { put } = await import('./client');
  const result = await put<any>(`/admin/settings/${key}`, { value });
  return result.data;
}

