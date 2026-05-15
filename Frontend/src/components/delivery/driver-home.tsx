'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useDeliveryOrders,
  useUpdateDeliveryStatus,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { DELIVERY_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Navigation,
  PackageOpen,
  Loader2,
  CircleDot,
  DollarSign,
  Activity,
  Bike,
} from 'lucide-react';
import type { DeliveryStatus } from '@/types';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function DriverHome() {
  const { user, setNotification, navigate } = useAuthStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const driverId = user?.id || '';
  const firstName = user?.name?.split(' ')[0] || 'Repartidor';
  const isAvailable = user?.delivery_driver_profile?.is_available ?? true;

  const {
    data: assignedResult,
    isLoading: assignedLoading,
  } = useDeliveryOrders({
    delivery_driver_id: driverId || undefined,
    status: 'assigned',
  });

  const {
    data: pickedUpResult,
    isLoading: pickedUpLoading,
  } = useDeliveryOrders({
    delivery_driver_id: driverId || undefined,
    status: 'picked_up',
  });

  const {
    data: inTransitResult,
    isLoading: inTransitLoading,
  } = useDeliveryOrders({
    delivery_driver_id: driverId || undefined,
    status: 'in_transit',
  });

  const {
    data: deliveredResult,
    isLoading: deliveredLoading,
  } = useDeliveryOrders({
    delivery_driver_id: driverId || undefined,
    status: 'delivered',
  });

  const updateDeliveryStatus = useUpdateDeliveryStatus();

  const assignedOrders = assignedResult?.data ?? [];
  const pickedUpOrders = pickedUpResult?.data ?? [];
  const inTransitOrders = inTransitResult?.data ?? [];
  const deliveredOrders = deliveredResult?.data ?? [];

  const activeOrders = [...assignedOrders, ...pickedUpOrders, ...inTransitOrders];
  const isLoading = assignedLoading || pickedUpLoading || inTransitLoading || deliveredLoading;

  // Calculate earnings from delivered orders
  const totalEarnings = deliveredOrders.reduce((sum, order) => {
    const amount = order.items
      ? order.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
      : 0;
    return sum + amount;
  }, 0);

  const handleStatusUpdate = (orderId: string, newStatus: 'picked_up' | 'in_transit' | 'delivered') => {
    setUpdatingId(orderId);
    updateDeliveryStatus.mutate(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          const statusLabels: Record<string, string> = {
            picked_up: 'Pedido recogido',
            in_transit: 'Ruta iniciada',
            delivered: 'Pedido entregado',
          };
          setNotification({ type: 'success', message: statusLabels[newStatus] || 'Estado actualizado' });
        },
        onError: () => {
          setNotification({ type: 'error', message: 'Error al actualizar estado' });
        },
        onSettled: () => {
          setUpdatingId(null);
        },
      }
    );
  };

  const getActionForOrder = (orderStatus: string) => {
    switch (orderStatus) {
      case 'assigned':
        return {
          label: 'Recoger pedido',
          icon: PackageOpen,
          newStatus: 'picked_up' as const,
          className: 'glass-btn-primary',
        };
      case 'picked_up':
        return {
          label: 'Iniciar ruta',
          icon: Navigation,
          newStatus: 'in_transit' as const,
          className: 'glass-btn-primary',
        };
      case 'in_transit':
        return {
          label: 'Marcar entregado',
          icon: CheckCircle2,
          newStatus: 'delivered' as const,
          className: 'glass-btn-primary',
        };
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bento-grid p-4 md:p-6">
        <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
        <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
        <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
        <div className="col-span-12"><div className="shimmer rounded-3xl h-40" /></div>
      </div>
    );
  }

  return (
    <motion.div className="bento-grid p-4 md:p-6" variants={stagger} initial="initial" animate="animate">
      {/* Status Card — col-span-4 */}
      <GlassCard className="col-span-4" variants={fadeUp}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex size-14 items-center justify-center rounded-full',
            isAvailable ? 'bg-emerald-500/10' : 'bg-amber-500/10',
          )}>
            <CircleDot className={cn(
              'size-6',
              isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
            )} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {isAvailable ? 'Disponible' : 'Ocupado'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAvailable ? 'Puedes recibir pedidos' : 'Tienes entregas activas'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Active Deliveries Count — col-span-4 */}
      <GlassCard className="col-span-4" variants={fadeUp}>
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-sky-500/10">
            <Truck className="size-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{activeOrders.length}</p>
            <p className="text-xs text-muted-foreground">Entregas activas</p>
          </div>
        </div>
      </GlassCard>

      {/* Earnings Summary — col-span-4 */}
      <GlassCard className="col-span-4" variants={fadeUp}>
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10">
            <DollarSign className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalEarnings)}</p>
            <p className="text-xs text-muted-foreground">{deliveredOrders.length} entregas completadas</p>
          </div>
        </div>
      </GlassCard>

      {/* Active Deliveries List — col-span-12 */}
      <GlassCard className="col-span-12" variants={fadeUp}>
        <h3 className="text-base font-semibold text-foreground mb-4">Entregas activas</h3>
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Bike className="size-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
            <p className="text-sm text-muted-foreground">Tu oasis de salud te espera</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-3">
            <AnimatePresence>
              {activeOrders.map((order) => {
                const action = getActionForOrder(order.status);
                const totalAmount = order.items
                  ? order.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
                  : 0;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="p-4 rounded-2xl glass hover:bg-teal-500/5 transition-colors cursor-pointer"
                    onClick={() => navigate('delivery-detail', order.id)}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {order.pharmacy?.name || 'Farmacia'}
                          </p>
                          <StatusBadge status={order.status} type="delivery" />
                        </div>
                        <p className="text-sm font-bold text-foreground whitespace-nowrap">
                          {formatCurrency(totalAmount)}
                        </p>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4 shrink-0 mt-0.5" />
                        <span>{order.delivery_address}</span>
                      </div>

                      {/* Items summary */}
                      {order.items && order.items.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="size-3.5" />
                          <span className="truncate">
                            {order.items.map((i) => `${i.medicine?.name || 'Med'} x${i.quantity}`).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Action button */}
                      {action && (
                        <div className="pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStatusUpdate(order.id, action.newStatus)}
                            disabled={updatingId === order.id}
                            className={cn(
                              'w-full gap-2 rounded-full px-4 py-2 text-sm font-medium flex items-center justify-center',
                              action.className,
                              'disabled:opacity-50',
                            )}
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <action.icon className="size-4" />
                            )}
                            {updatingId === order.id ? 'Actualizando...' : action.label}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
