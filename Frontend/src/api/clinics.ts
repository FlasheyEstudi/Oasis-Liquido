// ============================================
// MediRed - Clinics API Service
// GET /clinics, GET /clinics/:id
// GET /clinics/:id/doctors, POST /clinics
// PUT /clinics/:id, DELETE /clinics/:id (soft-delete)
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, post, put, patch } from './client';
import type {
  Clinic,
  CreateClinicRequest,
  UpdateClinicRequest,
  User,
  PaginatedResponse,
} from '@/types';

export interface ClinicListParams {
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

/** List clinics with optional geo/search filters */
export async function list(params?: ClinicListParams): Promise<PaginatedResponse<Clinic>> {
  return get<Clinic[]>('/clinics', params as Record<string, unknown>) as Promise<PaginatedResponse<Clinic>>;
}

/** Get clinic by ID */
export async function getById(id: string): Promise<Clinic> {
  const result = await get<Clinic>(`/clinics/${id}`);
  return result.data;
}

/** Get doctors for a specific clinic */
export async function getDoctors(clinicId: string, params?: { specialty?: string; search?: string }): Promise<User[]> {
  const result = await get<User[]>(`/clinics/${clinicId}/doctors`, params as Record<string, unknown>);
  return result.data;
}

/** Create a new clinic (admin) */
export async function create(data: CreateClinicRequest): Promise<Clinic> {
  const result = await post<Clinic>('/clinics', data);
  return result.data;
}

/** Update a clinic (admin) */
export async function update(id: string, data: UpdateClinicRequest): Promise<Clinic> {
  const result = await put<Clinic>(`/clinics/${id}`, data);
  return result.data;
}

/** Deactivate (soft-delete) a clinic (admin) */
export async function deleteClinic(id: string): Promise<Clinic> {
  const result = await patch<Clinic>(`/clinics/${id}`, { is_active: false });
  return result.data;
}

/** Get clinic reports */
export async function getReport(id: string, type: string = 'summary'): Promise<any> {
  return get(`/clinics/${id}/reports`, { type });
}

/** Create a sale/billing for a clinic service */
export async function createSale(clinicId: string, data: any): Promise<any> {
  const result = await post(`/clinics/${clinicId}/sales`, data);
  return result.data;
}
