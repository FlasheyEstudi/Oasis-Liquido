// OASIS - Sync Manager
// Handles background synchronization of pending sales when connection is recovered

import { createSale } from '@/api/deliveries';
import { 
  getPendingOfflineSales, 
  removePendingSale, 
  markPendingSaleFailed, 
  getPendingSalesCount 
} from './offline-store';

export type SyncEvent = 
  | { type: 'sync-started' }
  | { type: 'sale-synced'; saleId: number; data: any }
  | { type: 'sale-failed'; saleId: number; error: string; data: any }
  | { type: 'sync-finished'; totalSynced: number; totalFailed: number }
  | { type: 'status-changed'; pendingCount: number };

type SyncListener = (event: SyncEvent) => void;

class SyncManager {
  private listeners = new Set<SyncListener>();
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('OASIS: Connectivity restored. Triggering auto-sync...');
        this.syncPendingSales();
      });

      // Periodically check count to update UI state
      setInterval(async () => {
        const count = await getPendingSalesCount();
        this.emit({ type: 'status-changed', pendingCount: count });
      }, 5000);
    }
  }

  /**
   * Subscribe to sync events (start, success, fail, finish)
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    
    // Immediately trigger initial status update
    getPendingSalesCount().then(count => {
      listener({ type: 'status-changed', pendingCount: count });
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: SyncEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  /**
   * Perform synchronization of all pending offline sales
   */
  async syncPendingSales(): Promise<void> {
    if (this.isSyncing) return;
    
    // Check connection
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const pendingSales = await getPendingOfflineSales();
    if (pendingSales.length === 0) {
      const count = await getPendingSalesCount();
      this.emit({ type: 'status-changed', pendingCount: count });
      return;
    }

    this.isSyncing = true;
    this.emit({ type: 'sync-started' });

    let totalSynced = 0;
    let totalFailed = 0;

    for (const sale of pendingSales) {
      if (!sale.id) continue;
      
      try {
        // Post the sale data to the server
        const response = await createSale(sale.pharmacyId, sale.saleData);
        
        // Success: remove from local store
        await removePendingSale(sale.id);
        totalSynced++;
        
        this.emit({ type: 'sale-synced', saleId: sale.id, data: response });
      } catch (error: any) {
        console.error(`OASIS: Sync failed for sale ID ${sale.id}:`, error);

        const status = error.status || error.response?.status;
        const isClientOrStockError = 
          (status >= 400 && status < 500) ||
          error.message?.includes('INSUFFICIENT') ||
          error.response?.data?.error?.code?.includes('STOCK') ||
          error.response?.data?.error?.code?.includes('VALIDATION');

        if (isClientOrStockError) {
          // Mark as failed locally so the cashier knows and can rectify it
          await markPendingSaleFailed(sale.id);
          totalFailed++;
          
          const errorMsg = error.response?.data?.error?.message || error.message || 'Error de stock o validación';
          this.emit({ type: 'sale-failed', saleId: sale.id, error: errorMsg, data: sale.saleData });
        } else {
          // Network disconnect or server down - keep as pending and stop syncing the rest
          this.isSyncing = false;
          const count = await getPendingSalesCount();
          this.emit({ type: 'status-changed', pendingCount: count });
          this.emit({ type: 'sync-finished', totalSynced, totalFailed });
          return;
        }
      }
    }

    this.isSyncing = false;
    const finalCount = await getPendingSalesCount();
    this.emit({ type: 'status-changed', pendingCount: finalCount });
    this.emit({ type: 'sync-finished', totalSynced, totalFailed });
  }
}

export const syncManager = new SyncManager();
