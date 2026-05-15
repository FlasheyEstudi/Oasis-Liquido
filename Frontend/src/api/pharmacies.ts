// ============================================
// MediRed - Pharmacies API Service
// GET /pharmacies, GET /pharmacies/:id
// POST /pharmacies, PUT /pharmacies/:id
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, post, put } from './client';
import type {
  Pharmacy,
  CreatePharmacyRequest,
  UpdatePharmacyRequest,
  PaginatedResponse,
} from '@/types';

export interface PharmacyListParams {
  lat?: number;
  lng?: number;
  radius?: number;
  medicine_ids?: string[];
  quantities?: number[];
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

/** List pharmacies with optional geo/stock filters */
export async function list(params?: PharmacyListParams): Promise<PaginatedResponse<Pharmacy>> {
  return get<Pharmacy[]>('/pharmacies', params as Record<string, unknown>) as Promise<PaginatedResponse<Pharmacy>>;
}

/** Get pharmacy by ID */
export async function getById(id: string): Promise<Pharmacy> {
  const result = await get<Pharmacy>(`/pharmacies/${id}`);
  return result.data;
}

/** Create a new pharmacy (admin) */
export async function create(data: CreatePharmacyRequest): Promise<Pharmacy> {
  const result = await post<Pharmacy>('/pharmacies', data);
  return result.data;
}

/** Update a pharmacy (admin or pharmacy_manager) */
export async function update(id: string, data: UpdatePharmacyRequest): Promise<Pharmacy> {
  const result = await put<Pharmacy>(`/pharmacies/${id}`, data);
  return result.data;
}

/** Get pharmacy reports */
export async function getReport(id: string, type: string = 'summary'): Promise<any> {
  return get(`/pharmacies/${id}/reports`, { type });
}
