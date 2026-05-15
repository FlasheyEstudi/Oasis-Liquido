// ============================================
// MediRed - Users API Service (Admin)
// GET /users, GET /users/:id
// POST /users, PATCH /users/:id
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, post, patch } from './client';
import type {
  User,
  UpdateUserRequest,
  PaginatedResponse,
} from '@/types';

export interface UserListParams {
  role?: string;
  search?: string;
  is_active?: boolean;
  clinic_id?: string;
  pharmacy_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserAdminRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}

/** List users with optional filters (admin) */
export async function list(params?: UserListParams): Promise<PaginatedResponse<User>> {
  return get<User[]>('/users', params as Record<string, unknown>) as Promise<PaginatedResponse<User>>;
}

/** Get user by ID (admin) */
export async function getById(id: string): Promise<User> {
  const result = await get<User>(`/users/${id}`);
  return result.data;
}

/** Create a new user (admin) */
export async function create(data: CreateUserRequest): Promise<User> {
  const result = await post<User>('/users', data);
  return result.data;
}

/** Update a user (admin) */
export async function update(id: string, data: UpdateUserAdminRequest): Promise<User> {
  const result = await patch<User>(`/users/${id}`, data);
  return result.data;
}

/** Deactivate (soft-delete) a user (admin) */
export async function deleteUser(id: string): Promise<User> {
  const result = await patch<User>(`/users/${id}`, { is_active: false });
  return result.data;
}
