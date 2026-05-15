'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useDeliveryOrders,
  useAssignDriver,
  useUsers,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { DELIVERY_STATUS_CONFIG } from '@/utils/constants';
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
  Truck,
  MapPin,
  Package,
  User,
  Clock,
  UserCheck,
  CheckCircle2,
  Loader2,
  Activity,
  Filter,
} from 'lucide-react';
import type { DeliveryOrder, DeliveryStatus } from '@/types';

type TabValue = 'pending' | 'assigned' | 'in_transit' | 'delivered';

const TABS: { value: TabValue; label: string; statuses: DeliveryStatus[] }[] = [
  { value: 'pending', label: 'Pendientes', statuses: ['pending'] },
  { value: 'assigned', label: 'Asignadas', statuses: ['assigned', 'picked_up'] },
  { value: 'in_transit', label: 'En tránsito', statuses: ['in_transit'] },
  { value: 'delivered', label: 'Entregadas', statuses: ['delivered'] },
];

export function OrderManagement() {
  const { user, setNotification, navigate } = useAuthStore();
  const pharmacyId = 
    user?.pharmacy_manager_profile?.pharmacy_id || 
    (user as any)?.pharmacyManagerProfile?.pharmacyId || 
    'demo-pharmacy-1';
  const [activeTab, setActiveTab] = useState<TabValue>('pending');

  // Assign driver dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Get statuses for current tab
  const currentTab = TABS.find((t) => t.value === activeTab);
  const tabStatuses = currentTab?.statuses || [];

  const {
    data: ordersResult,
    isLoading,
    error,
    refetch,
  } = useDeliveryOrders({
    pharmacy_id: pharmacyId || undefined,
    status: tabStatuses[0] || undefined,
  });

  // Fetch available drivers
  const { data: driversResult } = useUsers({ role: 'delivery_driver' });
  const drivers = driversResult?.data ?? [];

  const assignDriver = useAssignDriver();

  // Filter orders for current tab's statuses
  const allOrders = ordersResult?.data ?? [];
  const orders = tabStatuses.length > 1
    ? allOrders.filter((o) => tabStatuses.includes(o.status))
    : allOrders;

  const handleAssignDriver = () => {
    if (!selectedOrder || !selectedDriverId) return;

    assignDriver.mutate(
      { id: selectedOrder.id, data: { driver_id: selectedDriverId } },
      {
        onSuccess: () => {
          setNotification({ type: 'success', message: 'Repartidor asignado correctamente' });
          setAssignDialogOpen(false);
          setSelectedOrder(null);
          setSelectedDriverId('');
        },
        onError: () => {
          setNotification({ type: 'error', message: 'Error al asignar repartidor' });
        },
      }
    );
  };

  const openAssignDialog = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setSelectedDriverId('');
    setAssignDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bento-grid p-4 md:p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-span-6"><div className="shimmer rounded-3xl h-40" /></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <Activity className="size-12 text-red-500/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{getHookErrorMessage(error) || 'Error al cargar pedidos'}</p>
        <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm font-medium">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Gestión de Pedidos</h2>
        <p className="text-sm text-muted-foreground">Administra las órdenes de entrega de la farmacia</p>
      </div>

      {/* Tab Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="size-4 text-muted-foreground shrink-0" />
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <motion.button
              key={tab.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'glass-btn-primary'
                  : 'glass-btn-secondary',
              )}
            >
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Truck className="size-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
          <p className="text-sm text-muted-foreground">Tu oasis de salud te espera</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {orders.map((order) => {
              const config = DELIVERY_STATUS_CONFIG[order.status];
              const itemsSummary = order.items
                ? order.items.map((i) => i.medicine?.name || 'Med').join(', ')
                : 'Sin items';
              const totalAmount = order.items
                ? order.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
                : 0;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <GlassCard hover onClick={() => navigate('order-management', order.id)}>
                    <div className="flex flex-col gap-3">
                      {/* Order header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            Pedido #{order.id.slice(0, 8)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {config && (
                              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', config.bgColor, config.color)}>
                                {config.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-foreground whitespace-nowrap">
                          {formatCurrency(totalAmount)}
                        </p>
                      </div>

                      {/* Patient & Address */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="size-3.5 shrink-0" />
                          <span className="truncate">{order.patient?.name || 'Sin paciente'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="size-3 shrink-0" />
                          <span className="truncate">{itemsSummary}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" />
                          <span>{formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      </div>

                      {/* Driver info if assigned */}
                      {order.driver && (
                        <div className="flex items-center gap-2 p-2 rounded-2xl bg-sky-500/5">
                          <UserCheck className="size-4 text-sky-600 dark:text-sky-400" />
                          <span className="text-sm text-sky-700 dark:text-sky-400 font-medium">{order.driver.name}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {order.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => { e.stopPropagation(); openAssignDialog(order); }}
                            className="glass-btn-primary rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-1.5"
                          >
                            <UserCheck className="size-3.5" />
                            Asignar repartidor
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Asignar Repartidor</DialogTitle>
            <DialogDescription>
              Selecciona un repartidor para el pedido #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <div className="p-3 rounded-2xl glass space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Dirección:</span>{' '}
                  {selectedOrder.delivery_address}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Paciente:</span>{' '}
                  {selectedOrder.patient?.name || 'N/A'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Seleccionar repartidor</label>
              {drivers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay repartidores disponibles</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {drivers.map((driver) => (
                    <motion.button
                      key={driver.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left',
                        selectedDriverId === driver.id
                          ? 'glass-strong border-teal-500/30'
                          : 'glass-input hover:bg-teal-500/5',
                      )}
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/10 shrink-0">
                        <User className="size-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{driver.name}</p>
                        {driver.delivery_driver_profile?.vehicle_type && (
                          <p className="text-xs text-muted-foreground">{driver.delivery_driver_profile.vehicle_type}</p>
                        )}
                      </div>
                      {selectedDriverId === driver.id && (
                        <CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400 shrink-0" />
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setAssignDialogOpen(false)}
              disabled={assignDriver.isPending}
              className="glass-btn-secondary rounded-full px-5 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignDriver}
              disabled={assignDriver.isPending || !selectedDriverId}
              className="glass-btn-primary rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {assignDriver.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Asignar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
