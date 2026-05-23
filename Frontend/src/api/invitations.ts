// OASIS - Invitations and Staff Management API
// Handles clinic and pharmacy staff invitations and workers management

import { get, post, put } from './client';
import type { User } from '@/types';

export interface Invitation {
  id: string;
  email: string;
  role: 'doctor' | 'receptionist' | 'cashier' | 'delivery_driver';
  token: string;
  expiresAt: string;
  isAccepted: boolean;
  clinicId?: string | null;
  pharmacyId?: string | null;
  clinic?: { name: string } | null;
  pharmacy?: { name: string } | null;
  createdAt: string;
}

export interface ClinicWorkersResponse {
  doctors: User[];
  receptionists: User[];
}

export interface PharmacyWorkersResponse {
  cashiers: User[];
  drivers: User[];
}

/**
 * Invite a doctor to a clinic (supports direct employee creation)
 */
export interface InviteDoctorData {
  email: string;
  name?: string;
  phone?: string;
  password?: string;
  specialty?: string;
  licenseNumber?: string;
}

export async function inviteDoctor(clinicId: string, data: InviteDoctorData): Promise<Invitation> {
  const result = await post<Invitation>(`/clinics/${clinicId}/doctors/invite`, data);
  return result.data;
}

/**
 * Invite a receptionist to a clinic (supports direct employee creation)
 */
export interface InviteReceptionistData {
  email: string;
  name?: string;
  phone?: string;
  password?: string;
}

export async function inviteReceptionist(clinicId: string, data: InviteReceptionistData): Promise<Invitation> {
  const result = await post<Invitation>(`/clinics/${clinicId}/receptionists/invite`, data);
  return result.data;
}

/**
 * Invite a cashier to a pharmacy (supports direct employee creation)
 */
export interface InviteCashierData {
  email: string;
  name?: string;
  phone?: string;
  password?: string;
}

export async function inviteCashier(pharmacyId: string, data: InviteCashierData): Promise<Invitation> {
  const result = await post<Invitation>(`/pharmacies/${pharmacyId}/cashiers/invite`, data);
  return result.data;
}

/**
 * Invite a delivery driver to a pharmacy (supports direct employee creation)
 */
export interface InviteDriverData {
  email: string;
  name?: string;
  phone?: string;
  password?: string;
  vehicleType?: string;
  licensePlate?: string;
}

export async function inviteDriver(pharmacyId: string, data: InviteDriverData): Promise<Invitation> {
  const result = await post<Invitation>(`/pharmacies/${pharmacyId}/drivers/invite`, data);
  return result.data;
}

/**
 * Get details of an invitation by token (public endpoint)
 */
export async function getInvitation(token: string): Promise<Invitation> {
  const result = await get<Invitation>(`/invitations/${token}`);
  return result.data;
}

/**
 * Accept invitation and register worker account (public endpoint)
 */
export async function acceptInvitation(
  token: string,
  data: { name: string; password?: string }
): Promise<User> {
  const result = await post<User>(`/invitations/${token}/accept`, data);
  return result.data;
}

/**
 * List workers for a clinic
 */
export async function listClinicWorkers(clinicId: string): Promise<ClinicWorkersResponse> {
  const result = await get<ClinicWorkersResponse>(`/clinics/${clinicId}/workers`);
  return result.data;
}

/**
 * List workers for a pharmacy
 */
export async function listPharmacyWorkers(pharmacyId: string): Promise<PharmacyWorkersResponse> {
  const result = await get<PharmacyWorkersResponse>(`/pharmacies/${pharmacyId}/workers`);
  return result.data;
}

/**
 * Change worker active status (enable/disable employee)
 */
export async function changeWorkerStatus(workerId: string, isActive: boolean): Promise<User> {
  const result = await put<User>(`/workers/${workerId}/status`, { isActive });
  return result.data;
}
