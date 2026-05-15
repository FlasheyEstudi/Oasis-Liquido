// ============================================
// MediRed - React Query Hooks
// Comprehensive hooks for EVERY API endpoint
// Uses @tanstack/react-query v5
// NO mock fallbacks — all calls go to the real backend
// ============================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DELIVERY_POLLING_INTERVAL } from '@/utils/constants';
import { getErrorMessage } from '@/api/client';

// --- API Service Imports ---
import * as authApi from '@/api/auth';
import * as appointmentsApi from '@/api/appointments';
import * as prescriptionsApi from '@/api/prescriptions';
import * as clinicsApi from '@/api/clinics';
import * as pharmaciesApi from '@/api/pharmacies';
import * as medicinesApi from '@/api/medicines';
import * as inventoryApi from '@/api/inventory';
import * as deliveriesApi from '@/api/deliveries';
import * as usersApi from '@/api/users';
import * as adminApi from '@/api/admin';
import * as chatsApi from '@/api/chats';
import * as reviewsApi from '@/api/reviews';

// --- Type Imports ---
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  UpdatePatientProfileRequest,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  CreatePrescriptionRequest,
  ValidatePrescriptionRequest,
  FulfillPrescriptionRequest,
  CreateClinicRequest,
  UpdateClinicRequest,
  CreatePharmacyRequest,
  UpdatePharmacyRequest,
  CreateMedicineRequest,
  UpdateMedicineRequest,
  AdjustInventoryRequest,
  AssignDriverRequest,
  UpdateDeliveryStatusRequest,
  CreateSaleRequest,
} from '@/types';

import type { AppointmentListParams } from '@/api/appointments';
import type { PrescriptionListParams } from '@/api/prescriptions';
import type { ClinicListParams } from '@/api/clinics';
import type { PharmacyListParams } from '@/api/pharmacies';
import type { MedicineListParams } from '@/api/medicines';
import type { InventoryListParams } from '@/api/inventory';
import type { DeliveryListParams } from '@/api/deliveries';
import type { UserListParams, CreateUserRequest, UpdateUserAdminRequest } from '@/api/users';
import type { AdminStatsParams, AuditLogListParams } from '@/api/admin';

// ============================================
// AUTH HOOKS
// ============================================

/** Login mutation */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/** Register mutation */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

/** Forgot password mutation */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
  });
}

/** Reset password mutation */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
  });
}

/** Refresh token mutation */
export function useRefreshToken() {
  return useMutation({
    mutationFn: () => authApi.refreshToken(),
  });
}

/** Get current user profile */
export function useGetMe(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled,
  });
}

/** Update current user profile */
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => authApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/** Update patient profile */
export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePatientProfileRequest) => authApi.updatePatientProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ============================================
// APPOINTMENT HOOKS
// ============================================

/** List appointments */
export function useAppointments(params?: AppointmentListParams) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsApi.list(params),
  });
}

/** Get a single appointment */
export function useAppointment(id: string, enabled = true) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id && enabled,
  });
}

/** Create appointment */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Update appointment */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentRequest }) =>
      appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Update appointment status */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentStatusRequest }) =>
      appointmentsApi.updateStatus(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
    },
  });
}

// ============================================
// PRESCRIPTION HOOKS
// ============================================

/** List prescriptions */
export function usePrescriptions(params?: PrescriptionListParams) {
  return useQuery({
    queryKey: ['prescriptions', params],
    queryFn: () => prescriptionsApi.list(params),
  });
}

/** Get a single prescription */
export function usePrescription(id: string, enabled = true) {
  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: () => prescriptionsApi.getById(id),
    enabled: !!id && enabled,
  });
}

/** Create prescription */
export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePrescriptionRequest) => prescriptionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

/** Validate prescription by QR */
export function useValidatePrescription() {
  return useMutation({
    mutationFn: (data: ValidatePrescriptionRequest) => prescriptionsApi.validate(data),
  });
}

/** Fulfill prescription */
export function useFulfillPrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FulfillPrescriptionRequest }) =>
      prescriptionsApi.fulfill(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', variables.id] });
    },
  });
}

// ============================================
// CLINIC HOOKS
// ============================================

/** List clinics */
export function useClinics(params?: ClinicListParams) {
  return useQuery({
    queryKey: ['clinics', params],
    queryFn: () => clinicsApi.list(params),
  });
}

/** Get a single clinic */
export function useClinic(id: string, enabled = true) {
  return useQuery({
    queryKey: ['clinics', id],
    queryFn: () => clinicsApi.getById(id),
    enabled: !!id && enabled,
  });
}

/** Get clinic doctors */
export function useClinicDoctors(clinicId: string, params?: { specialty?: string; search?: string }, enabled = true) {
  return useQuery({
    queryKey: ['clinics', clinicId, 'doctors', params],
    queryFn: () => clinicsApi.getDoctors(clinicId, params),
    enabled: !!clinicId && enabled,
  });
}

/** Create clinic */
export function useCreateClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClinicRequest) => clinicsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    },
  });
}

/** Update clinic */
export function useUpdateClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClinicRequest }) =>
      clinicsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    },
  });
}

/** Get clinic reports */
export function useClinicReport(id: string, type: string = 'summary', enabled = true) {
  return useQuery({
    queryKey: ['clinics', id, 'reports', type],
    queryFn: () => clinicsApi.getReport(id, type),
    enabled: !!id && enabled,
  });
}

// ============================================
// PHARMACY HOOKS
// ============================================

/** List pharmacies */
export function usePharmacies(params?: PharmacyListParams) {
  return useQuery({
    queryKey: ['pharmacies', params],
    queryFn: () => pharmaciesApi.list(params),
  });
}

/** Get a single pharmacy */
export function usePharmacy(id: string, enabled = true) {
  return useQuery({
    queryKey: ['pharmacies', id],
    queryFn: () => pharmaciesApi.getById(id),
    enabled: !!id && enabled,
  });
}

/** Create pharmacy */
export function useCreatePharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePharmacyRequest) => pharmaciesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
    },
  });
}

/** Update pharmacy */
export function useUpdatePharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePharmacyRequest }) =>
      pharmaciesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
    },
  });
}

/** Get pharmacy reports */
export function usePharmacyReport(id: string, type: string = 'summary', enabled = true) {
  return useQuery({
    queryKey: ['pharmacies', id, 'reports', type],
    queryFn: () => pharmaciesApi.getReport(id, type),
    enabled: !!id && enabled,
  });
}

// ============================================
// MEDICINE HOOKS
// ============================================

/** List medicines */
export function useMedicines(params?: MedicineListParams) {
  return useQuery({
    queryKey: ['medicines', params],
    queryFn: () => medicinesApi.list(params),
  });
}

/** Get a single medicine */
export function useMedicine(id: string, enabled = true) {
  return useQuery({
    queryKey: ['medicines', id],
    queryFn: () => medicinesApi.getById(id),
    enabled: !!id && enabled,
  });
}

/** Create medicine */
export function useCreateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicineRequest) => medicinesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

/** Update medicine */
export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicineRequest }) =>
      medicinesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

// ============================================
// INVENTORY HOOKS
// ============================================

/** List inventory for a pharmacy */
export function useInventory(pharmacyId: string, params?: InventoryListParams, enabled = true) {
  return useQuery({
    queryKey: ['inventory', pharmacyId, params],
    queryFn: () => inventoryApi.getByPharmacy(pharmacyId, params),
    enabled: !!pharmacyId && enabled,
  });
}

/** Adjust inventory */
export function useAdjustInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pharmacyId, data }: { pharmacyId: string; data: AdjustInventoryRequest }) =>
      inventoryApi.adjust(pharmacyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
  });
}

/** Get inventory movements */
export function useInventoryMovements(pharmacyId: string, params?: any) {
  return useQuery({
    queryKey: ['inventory-movements', pharmacyId, params],
    queryFn: () => inventoryApi.getMovements(pharmacyId, params),
    enabled: !!pharmacyId,
  });
}

// ============================================
// DELIVERY HOOKS
// ============================================

/** List delivery orders */
export function useDeliveryOrders(params?: DeliveryListParams) {
  return useQuery({
    queryKey: ['delivery-orders', params],
    queryFn: () => deliveriesApi.list(params),
  });
}

/** Get a single delivery order */
export function useDeliveryOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: ['delivery-orders', id],
    queryFn: () => deliveriesApi.getById(id),
    enabled: !!id && enabled,
  });
}

/** Update delivery status */
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeliveryStatusRequest }) =>
      deliveriesApi.updateStatus(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-orders', variables.id] });
    },
  });
}

/** Assign driver to delivery order */
export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignDriverRequest }) =>
      deliveriesApi.assignDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    },
  });
}

/** Get delivery route */
export function useDeliveryRoute(id: string, enabled = true) {
  return useQuery({
    queryKey: ['delivery-orders', id, 'route'],
    queryFn: () => deliveriesApi.getRoute(id),
    enabled: !!id && enabled,
  });
}

/** Create sale (pharmacy counter or delivery) */
export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pharmacyId, data }: { pharmacyId: string; data: CreateSaleRequest }) =>
      deliveriesApi.createSale(pharmacyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

/** Delivery order tracking with polling */
export function useDeliveryOrderTracking(id: string) {
  return useQuery({
    queryKey: ['delivery-orders', id, 'tracking'],
    queryFn: () => deliveriesApi.getById(id),
    refetchInterval: DELIVERY_POLLING_INTERVAL,
    enabled: !!id,
  });
}

// ============================================
// USER HOOKS (Admin)
// ============================================

/** List users */
export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
  });
}

/** Get a single user */
export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id && enabled,
  });
}

/** Create user (admin) */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/** Update user (admin) */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserAdminRequest }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ============================================
// ADMIN HOOKS
// ============================================

/** Get admin dashboard stats */
export function useAdminStats(params?: AdminStatsParams) {
  return useQuery({
    queryKey: ['admin', 'stats', params],
    queryFn: () => adminApi.getStats(params),
  });
}

/** Get audit logs */
export function useAuditLogs(params?: AuditLogListParams) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminApi.getAuditLogs(params),
  });
}

// ============================================
// CHAT HOOKS
// ============================================

/** List chat sessions */
export function useChatSessions(params?: any) {
  return useQuery({
    queryKey: ['chats', 'sessions', params],
    queryFn: () => chatsApi.listSessions(params),
  });
}

/** Get messages for a session */
export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: ['chats', 'messages', sessionId],
    queryFn: () => chatsApi.getSessionMessages(sessionId),
    enabled: !!sessionId,
    refetchInterval: 3000, // Poll for new messages every 3s
  });
}

/** Send a message */
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sessionId: string; content: string }) => chatsApi.sendMessage(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats', 'messages', variables.sessionId] });
    },
  });
}

/** Create chat session */
export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; targetId?: string; participantIds: string[] }) =>
      chatsApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', 'sessions'] });
    },
  });
}

// ============================================
// REVIEW HOOKS
// ============================================

/** List reviews */
export function useReviews(params?: any) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewsApi.listReviews(params),
  });
}

/** Create review */
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetId: string; targetType: string; rating: number; comment?: string }) =>
      reviewsApi.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

/** Get review stats */
export function useReviewStats(params?: any) {
  return useQuery({
    queryKey: ['reviews', 'stats', params],
    queryFn: () => reviewsApi.getStats(params),
  });
}

// ============================================
// UTILITY: Error message extraction for hooks
// ============================================

/** Extract a user-friendly error message from a React Query error. */
export function getHookErrorMessage(error: unknown): string {
  return getErrorMessage(error);
}
