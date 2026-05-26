// ============================================
// OASIS - Settings API Service
// ============================================

import { get, put } from './client';

export interface UserSettings {
  id: string;
  userId: string;
  language: string;
  theme: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
}

export interface ClinicSettings {
  id: string;
  clinicId: string;
  consultationFeeDefault: number;
  allowOnlineBooking: boolean;
  preBookingDaysLimit: number;
  cancellationHoursLimit: number;
  sendAutomaticReminders: boolean;
  reminderChannel: string;
  doctorBreakTimeMinutes: number;
  hoursOfOperation?: any;
}

export interface PharmacySettings {
  id: string;
  pharmacyId: string;
  lowStockAlertEnabled: boolean;
  minStockAlertThreshold: number;
  medicineNearExpiryDays: number;
  deliveryFeeDefault: number;
  allowCashOnDelivery: boolean;
  allowCardOnDelivery: boolean;
  autoReorderEnabled: boolean;
}

/** Fetch user settings */
export async function getUserSettings(): Promise<UserSettings> {
  const result = await get<UserSettings>('/user/settings');
  return result.data;
}

/** Update user settings */
export async function updateUserSettings(data: Partial<UserSettings>): Promise<UserSettings> {
  const result = await put<UserSettings>('/user/settings', data);
  return result.data;
}

/** Fetch clinic settings */
export async function getClinicSettings(): Promise<ClinicSettings> {
  const result = await get<ClinicSettings>('/clinic/settings');
  return result.data;
}

/** Update clinic settings */
export async function updateClinicSettings(data: Partial<ClinicSettings>): Promise<ClinicSettings> {
  const result = await put<ClinicSettings>('/clinic/settings', data);
  return result.data;
}

/** Fetch pharmacy settings */
export async function getPharmacySettings(): Promise<PharmacySettings> {
  const result = await get<PharmacySettings>('/pharmacy/settings');
  return result.data;
}

/** Update pharmacy settings */
export async function updatePharmacySettings(data: Partial<PharmacySettings>): Promise<PharmacySettings> {
  const result = await put<PharmacySettings>('/pharmacy/settings', data);
  return result.data;
}
