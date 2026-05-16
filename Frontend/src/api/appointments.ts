// ============================================
// OASIS - Appointments API Service
// GET /appointments, GET /appointments/:id
// POST /appointments, PATCH /appointments/:id
// PATCH /appointments/:id/status
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, post, patch } from './client';
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  PaginatedResponse,
} from '@/types';

export interface AppointmentListParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  clinic_id?: string;
  doctor_id?: string;
  patient_id?: string;
  page?: number;
  limit?: number;
}

/** List appointments with optional filters */
export async function list(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
  return get<Appointment[]>('/appointments', params as Record<string, unknown>) as Promise<PaginatedResponse<Appointment>>;
}

/** Get appointment by ID */
export async function getById(id: string): Promise<Appointment> {
  const result = await get<Appointment>(`/appointments/${id}`);
  return result.data;
}

/** Create a new appointment */
export async function create(data: CreateAppointmentRequest): Promise<Appointment> {
  const result = await post<Appointment>('/appointments', data);
  return result.data;
}

/** Update appointment */
export async function update(id: string, data: UpdateAppointmentRequest): Promise<Appointment> {
  const result = await patch<Appointment>(`/appointments/${id}`, data);
  return result.data;
}

/** Update appointment status */
export async function updateStatus(id: string, data: UpdateAppointmentStatusRequest): Promise<Appointment> {
  const result = await patch<Appointment>(`/appointments/${id}/status`, data);
  return result.data;
}
