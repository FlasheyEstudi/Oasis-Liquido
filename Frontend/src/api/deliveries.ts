// ============================================
// OASIS - Deliveries API Service
// GET /delivery-orders, GET /delivery-orders/:id
// PATCH /delivery-orders/:id/status, PATCH /delivery-orders/:id/assign
// GET /delivery-orders/:id/route
// POST /pharmacies/:id/sales
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, patch, post } from './client';
import type {
  DeliveryOrder,
  AssignDriverRequest,
  UpdateDeliveryStatusRequest,
  DeliveryRoute,
  CreateSaleRequest,
  SaleResponse,
  PaginatedResponse,
} from '@/types';

export interface DeliveryListParams {
  status?: string;
  driver_id?: string;
  pharmacy_id?: string;
  date_from?: string;
  page?: number;
  limit?: number;
}

/** List delivery orders with optional filters */
export async function list(params?: DeliveryListParams): Promise<PaginatedResponse<DeliveryOrder>> {
  return get<DeliveryOrder[]>('/delivery-orders', params as Record<string, unknown>) as Promise<PaginatedResponse<DeliveryOrder>>;
}

/** Get delivery order by ID */
export async function getById(id: string): Promise<DeliveryOrder> {
  const result = await get<DeliveryOrder>(`/delivery-orders/${id}`);
  return result.data;
}

/** Update delivery status */
export async function updateStatus(id: string, data: UpdateDeliveryStatusRequest): Promise<DeliveryOrder> {
  const result = await patch<DeliveryOrder>(`/delivery-orders/${id}/status`, data);
  return result.data;
}

/** Assign a driver to a delivery order */
export async function assignDriver(id: string, data: AssignDriverRequest): Promise<DeliveryOrder> {
  const result = await patch<DeliveryOrder>(`/delivery-orders/${id}/assign`, data);
  return result.data;
}

/** Get delivery route */
export async function getRoute(id: string): Promise<DeliveryRoute> {
  const result = await get<DeliveryRoute>(`/delivery-orders/${id}/route`);
  return result.data;
}

/** Create a sale (counter or delivery) */
export async function createSale(pharmacyId: string, data: CreateSaleRequest): Promise<SaleResponse['data']> {
  const result = await post<SaleResponse['data']>(`/pharmacies/${pharmacyId}/sales`, data);
  return result.data;
}
