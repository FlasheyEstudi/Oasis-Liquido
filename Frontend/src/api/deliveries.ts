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
  delivery_driver_id?: string;
  patient_id?: string;
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
  if (!id) {
    throw new Error('ID de pedido requerido');
  }
  const result = await get<DeliveryOrder>(`/delivery-orders/${id}`);
  return result.data;
}

/** Update delivery status */
export async function updateStatus(id: string, data: UpdateDeliveryStatusRequest): Promise<DeliveryOrder> {
  if (!id) {
    throw new Error('ID de pedido requerido para actualizar estado');
  }
  const result = await patch<DeliveryOrder>(`/delivery-orders/${id}/status`, data);
  return result.data;
}

/** Assign a driver to a delivery order */
export async function assignDriver(id: string, data: AssignDriverRequest): Promise<DeliveryOrder> {
  if (!id) {
    throw new Error('ID de pedido requerido para asignar repartidor');
  }
  const result = await patch<DeliveryOrder>(`/delivery-orders/${id}/assign`, data);
  return result.data;
}

/** Get delivery route */
export async function getRoute(
  id: string,
  params?: { currentLat?: number; currentLng?: number; stage?: string }
): Promise<any> {
  if (!id) {
    throw new Error('ID de pedido requerido para obtener ruta');
  }
  const result = await get<any>(`/delivery-orders/${id}/route`, params as Record<string, unknown>);
  return result.data;
}

/** Create a sale (counter or delivery) */
export async function createSale(pharmacyId: string, data: CreateSaleRequest): Promise<SaleResponse['data']> {
  const result = await post<SaleResponse['data']>(`/pharmacies/${pharmacyId}/sales`, data);
  return result.data;
}

/** Update delivery driver current location */
export async function updateLocation(orderId: string, lat: number, lng: number): Promise<{ success: boolean }> {
  const result = await post<{ success: boolean }>('/delivery/location', { orderId, lat, lng });
  return result.data;
}

/** GET available orders for drivers */
export async function getAvailableDeliveries(): Promise<any[]> {
  const result = await get<any[]>('/delivery/orders/available');
  return result.data;
}

/** GET assigned orders for drivers */
export async function getAssignedDeliveries(): Promise<any[]> {
  const result = await get<any[]>('/delivery/orders/assigned');
  return result.data;
}

/** ACCEPT an order */
export async function acceptDelivery(id: string): Promise<any> {
  const result = await post<any>(`/delivery/orders/${id}/accept`, {});
  return result.data;
}

/** REJECT an order */
export async function rejectDelivery(id: string): Promise<any> {
  const result = await post<any>(`/delivery/orders/${id}/reject`, {});
  return result.data;
}

/** PICKUP an order */
export async function pickupDelivery(id: string): Promise<any> {
  const result = await post<any>(`/delivery/orders/${id}/pickup`, {});
  return result.data;
}

/** DELIVER an order */
export async function deliverDelivery(id: string): Promise<any> {
  const result = await post<any>(`/delivery/orders/${id}/complete`, {});
  return result.data;
}

/** FAIL an order */
export async function failDelivery(id: string, reason: string): Promise<any> {
  const result = await post<any>(`/delivery/orders/${id}/fail`, { reason });
  return result.data;
}

/** GET driver earnings statistics */
export async function getDriverEarnings(): Promise<any> {
  const result = await get<any>('/delivery/earnings');
  return result.data;
}


