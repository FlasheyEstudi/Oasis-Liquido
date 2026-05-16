'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useInventory,
  useAdjustInventory,
  useInventoryMovements,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { InventoryItem } from '@/types';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { DOSAGE_FORMS } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  Plus,
  Minus,
  ArrowUpDown,
  Activity,
  Loader2,
} from 'lucide-react';

function stockIndicator(quantity: number): { dot: string; bar: string; label: string; textColor: string } {
  if (quantity > 50) return { dot: 'bg-emerald-500', bar: 'bg-emerald-500', label: 'En stock', textColor: 'text-emerald-600 dark:text-emerald-400' };
  if (quantity >= 10) return { dot: 'bg-amber-500', bar: 'bg-amber-500', label: 'Stock medio', textColor: 'text-amber-600 dark:text-amber-400' };
  if (quantity > 0) return { dot: 'bg-red-500', bar: 'bg-red-500', label: 'Stock bajo', textColor: 'text-red-600 dark:text-red-400' };
  return { dot: 'bg-red-600', bar: 'bg-red-600', label: 'Sin stock', textColor: 'text-red-600 dark:text-red-400' };
}

export function Inventory() {
  const { user, setNotification } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<string>('');

  const pharmacyId = 
    user?.pharmacy_manager_profile?.pharmacy_id || 
    (user as any)?.pharmacyManagerProfile?.pharmacyId || 
    'demo-pharmacy-1';

  const {
    data: inventoryResult,
    isLoading,
    error,
    refetch,
  } = useInventory(pharmacyId, {
    search: searchQuery || undefined,
    low_stock: lowStockOnly || undefined,
  }, !!pharmacyId);

  const {
    data: movementsResult,
    isLoading: movementsLoading,
  } = useInventoryMovements(pharmacyId);

  const adjustInventory = useAdjustInventory();

  const inventory = inventoryResult?.data ?? [];
  const movements = movementsResult?.data ?? [];
  const isAdjusting = adjustInventory.isPending;

  const handleAdjustStock = () => {
    if (!adjustingItem) return;
    const data: { medicine_id: string; quantity_change: number; price?: number } = {
      medicine_id: adjustingItem.medicine.id,
      quantity_change: quantityChange,
    };
    if (newPrice && parseFloat(newPrice) !== adjustingItem.unitPrice) {
      data.price = parseFloat(newPrice);
    }
    adjustInventory.mutate(
      { pharmacyId, data },
      {
        onSuccess: () => {
          setNotification({ type: 'success', message: 'Stock ajustado correctamente' });
          setAdjustDialogOpen(false);
          setAdjustingItem(null);
          setQuantityChange(0);
          setNewPrice('');
        },
        onError: () => {
          setNotification({ type: 'error', message: 'Error al ajustar stock' });
        },
      }
    );
  };

  const openAdjustDialog = (item: InventoryItem) => {
    setAdjustingItem(item);
    setQuantityChange(0);
    setNewPrice(item.unitPrice.toString());
    setAdjustDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bento-grid p-4 md:p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="col-span-6"><div className="shimmer rounded-3xl h-28" /></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <Activity className="size-12 text-red-500/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{getHookErrorMessage(error) || 'Error al cargar inventario'}</p>
        <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm font-medium">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Inventario de Farmacia</h2>
          <p className="text-sm text-muted-foreground">{inventory.length} productos registrados</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
              lowStockOnly
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                : 'glass-input hover:bg-amber-500/5',
            )}
          >
            Solo stock bajo
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          placeholder="Buscar medicamento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input rounded-full w-full pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Inventory Table */}
      {inventory.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Package className="size-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
          <p className="text-sm text-muted-foreground mb-4">No se encontraron medicamentos con los filtros actuales</p>
          <button
            onClick={() => { setSearchQuery(''); setLowStockOnly(false); }}
            className="glass-btn-primary rounded-full px-6 py-2 text-sm font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="glass rounded-3xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_120px_100px_80px] gap-2 px-6 py-3 border-b border-border text-xs font-medium text-muted-foreground">
            <span>Medicamento</span>
            <span className="text-center">Presentación</span>
            <span className="text-right">Precio</span>
            <span className="text-center">Stock</span>
          </div>

          {/* Table rows */}
          <AnimatePresence>
            {inventory.map((item, index) => {
              const si = stockIndicator(item.quantity);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => openAdjustDialog(item)}
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-[1fr_120px_100px_80px] gap-2 px-6 py-4',
                    'cursor-pointer hover:bg-teal-500/5 transition-colors',
                    'border-b border-border last:border-0',
                  )}
                >
                  {/* Medicine info */}
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10">
                      <Package className="size-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{item.medicine.name}</p>
                        {item.medicine.requires_prescription && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium">
                            Receta
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {DOSAGE_FORMS[item.medicine.dosage_form || ''] || item.medicine.dosage_form || 'N/A'} · {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Dosage form (desktop) */}
                  <p className="hidden md:block text-sm text-muted-foreground text-center self-center">
                    {DOSAGE_FORMS[item.medicine.dosage_form || ''] || item.medicine.dosage_form || 'N/A'}
                  </p>

                  {/* Price (desktop) */}
                  <p className="hidden md:block text-sm font-medium text-foreground text-right self-center">
                    {formatCurrency(item.unitPrice)}
                  </p>

                  {/* Stock indicator */}
                  <div className="flex items-center gap-2 justify-end md:justify-center self-center">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('size-2 rounded-full', si.dot)} />
                      <span className={cn('text-sm font-bold', si.textColor)}>{item.quantity}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); openAdjustDialog(item); }}
                      className="inline-flex size-7 items-center justify-center rounded-full glass-input hover:bg-teal-500/5 hover:border-teal-500/30 transition-all"
                    >
                      <ArrowUpDown className="size-3" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Kardex (Movement History) */}
      <GlassCard className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-teal-500" />
            <h3 className="text-lg font-bold text-foreground">Historial de Movimientos (Kardex)</h3>
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Últimos 50 movimientos</span>
        </div>

        <div className="space-y-3">
          {movementsLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-6 animate-spin" />
              Cargando historial...
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">No hay movimientos registrados aún</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-4">
                    <th className="pb-2 px-4">Fecha</th>
                    <th className="pb-2 px-4">Medicamento</th>
                    <th className="pb-2 px-4">Tipo</th>
                    <th className="pb-2 px-4 text-right">Cantidad</th>
                    <th className="pb-2 px-4">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov: any) => (
                    <tr key={mov.id} className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl overflow-hidden group">
                      <td className="py-3 px-4 rounded-l-xl text-xs font-medium text-muted-foreground">
                        {formatDate(mov.createdAt, 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {mov.inventory?.medicine?.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                          mov.type === 'restock' ? "bg-emerald-500/10 text-emerald-600" :
                          mov.type === 'sale' ? "bg-blue-500/10 text-blue-600" :
                          "bg-amber-500/10 text-amber-600"
                        )}>
                          {mov.type === 'restock' ? 'Entrada' : mov.type === 'sale' ? 'Salida' : 'Ajuste'}
                        </span>
                      </td>
                      <td className={cn(
                        "py-3 px-4 text-right font-black",
                        mov.quantityChange > 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                      </td>
                      <td className="py-3 px-4 rounded-r-xl text-xs text-muted-foreground">
                        {mov.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              Ajusta la cantidad y precio de {adjustingItem?.medicine.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 rounded-2xl glass">
              <span className="text-sm text-muted-foreground">Stock actual</span>
              <span className="text-lg font-bold text-foreground">{adjustingItem?.quantity || 0} uds</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cambio de cantidad</label>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setQuantityChange((q) => q - 1)}
                  className="shrink-0 inline-flex size-9 items-center justify-center rounded-full glass-input hover:bg-red-500/5 hover:border-red-500/30 transition-all"
                >
                  <Minus className="size-4" />
                </motion.button>
                <input
                  type="number"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
                  className="glass-input rounded-xl text-center flex-1 py-2"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setQuantityChange((q) => q + 1)}
                  className="shrink-0 inline-flex size-9 items-center justify-center rounded-full glass-input hover:bg-teal-500/5 hover:border-teal-500/30 transition-all"
                >
                  <Plus className="size-4" />
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground">Usa valores negativos para restar stock</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Precio (opcional)</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="glass-input rounded-xl w-full px-4 py-2.5 text-sm"
                placeholder={adjustingItem?.unitPrice.toString()}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-500/5">
              <span className="text-sm text-teal-700 dark:text-teal-400">Stock resultante</span>
              <span className="text-lg font-bold text-teal-700 dark:text-teal-400">
                {(adjustingItem?.quantity || 0) + quantityChange} uds
              </span>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setAdjustDialogOpen(false)}
              disabled={isAdjusting}
              className="glass-btn-secondary rounded-full px-5 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdjustStock}
              disabled={isAdjusting || quantityChange === 0}
              className="glass-btn-primary rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2"
            >
              {isAdjusting ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar ajuste
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
