// ============================================
// MediRed - Prescriptions API Service
// GET /prescriptions, GET /prescriptions/:id
// POST /prescriptions, POST /prescriptions/validate
// POST /prescriptions/:id/fulfill
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, post } from './client';
import type {
  Prescription,
  CreatePrescriptionRequest,
  ValidatePrescriptionRequest,
  FulfillPrescriptionRequest,
  PaginatedResponse,
} from '@/types';

export interface PrescriptionListParams {
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  date_from?: string;
  page?: number;
  limit?: number;
}

/** List prescriptions with optional filters */
export async function list(params?: PrescriptionListParams): Promise<PaginatedResponse<Prescription>> {
  return get<Prescription[]>('/prescriptions', params as Record<string, unknown>) as Promise<PaginatedResponse<Prescription>>;
}

/** Get prescription by ID */
export async function getById(id: string): Promise<Prescription> {
  const result = await get<Prescription>(`/prescriptions/${id}`);
  return result.data;
}

/** Create a new prescription (doctor) */
export async function create(data: CreatePrescriptionRequest): Promise<Prescription> {
  const result = await post<Prescription>('/prescriptions', data);
  return result.data;
}

/** Validate prescription by QR code */
export async function validate(data: ValidatePrescriptionRequest): Promise<Prescription> {
  const result = await post<Prescription>('/prescriptions/validate', data);
  return result.data;
}

/** Fulfill a prescription (pharmacy) */
export async function fulfill(id: string, data: FulfillPrescriptionRequest): Promise<Prescription> {
  const result = await post<Prescription>(`/prescriptions/${id}/fulfill`, data);
  return result.data;
}
