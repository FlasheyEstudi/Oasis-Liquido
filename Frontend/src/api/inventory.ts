// ============================================
// OASIS - Inventory API Service
// GET /pharmacies/:id/inventory
// PATCH /pharmacies/:id/inventory
// NO mock fallbacks — all calls go to the real backend
// ============================================

import { get, patch, post } from './client';
import type {
  InventoryItem,
  AdjustInventoryRequest,
  PaginatedResponse,
} from '@/types';

export interface InventoryListParams {
  search?: string;
  low_stock?: boolean;
  medicine_id?: string;
  page?: number;
  limit?: number;
}

/** Get inventory for a specific pharmacy */
export async function getByPharmacy(pharmacyId: string, params?: InventoryListParams): Promise<PaginatedResponse<InventoryItem>> {
  return get<InventoryItem[]>(`/pharmacies/${pharmacyId}/inventory`, params as Record<string, unknown>) as Promise<PaginatedResponse<InventoryItem>>;
}

/** Adjust inventory stock for a pharmacy */
export async function adjust(pharmacyId: string, data: AdjustInventoryRequest): Promise<InventoryItem> {
  const payload: any = {
    medicine_id: data.medicine_id,
    quantity_change: data.quantity_change,
  };
  if (data.price !== undefined) {
    payload.new_price = data.price;
  }
  const result = await post<InventoryItem>(`/pharmacies/${pharmacyId}/inventory/adjust`, payload);
  return result.data;
}

/** Get inventory movements (Kardex) */
export async function getMovements(pharmacyId: string, params?: any): Promise<any> {
  const result = await get<any[]>(`/pharmacies/${pharmacyId}/inventory/movements`, params);
  return result.data;
}

/** Get expiring batches (FEFO) */
export async function getExpiringBatches(pharmacyId: string): Promise<any> {
  const result = await get<any[]>(`/pharmacies/${pharmacyId}/inventory/expirations`);
  return result.data;
}

