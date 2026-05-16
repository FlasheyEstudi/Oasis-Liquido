// ============================================
// OASIS - Medicines API Service
// GET /medicines, GET /medicines/:id
// POST /medicines, PUT /medicines/:id
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, post, put } from './client';
import type {
  Medicine,
  CreateMedicineRequest,
  UpdateMedicineRequest,
  PaginatedResponse,
} from '@/types';

export interface MedicineListParams {
  search?: string;
  requires_prescription?: boolean;
  dosage_form?: string;
  page?: number;
  limit?: number;
}

/** List medicines from the master catalog */
export async function list(params?: MedicineListParams): Promise<PaginatedResponse<Medicine>> {
  return get<Medicine[]>('/medicines', params as Record<string, unknown>) as Promise<PaginatedResponse<Medicine>>;
}

/** Get medicine by ID */
export async function getById(id: string): Promise<Medicine> {
  const result = await get<Medicine>(`/medicines/${id}`);
  return result.data;
}

/** Create a new medicine (admin) */
export async function create(data: CreateMedicineRequest): Promise<Medicine> {
  const result = await post<Medicine>('/medicines', data);
  return result.data;
}

/** Update a medicine (admin) */
export async function update(id: string, data: UpdateMedicineRequest): Promise<Medicine> {
  const result = await put<Medicine>(`/medicines/${id}`, data);
  return result.data;
}
