'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useDeliveryOrders,
  useUpdateDeliveryStatus,
  useAvailableDeliveries,
  useAcceptDelivery,
  useRejectDelivery,
  useDriverEarnings,
  useAssignedDeliveries,
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
  Check,
  X,
  Star,
  Sparkles,
} from 'lucide-react';
import type { DeliveryStatus } from '@/types';

const stagger: any = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp: any = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function DriverHome() {
  const { user, setNotification, navigate } = useAuthStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localAvailable, setLocalAvailable] = useState(true);

  const driverId = user?.id || '';
  const firstName = user?.name?.split(' ')[0] || 'Repartidor';

  // Earnings Stats hook
  const { data: stats } = useDriverEarnings(localAvailable);

  // Available freelance orders feed
  const { data: availableOrders = [], isLoading: availableLoading } = useAvailableDeliveries(localAvailable);

  const { mutateAsync: acceptOrder } = useAcceptDelivery();
  const { mutateAsync: rejectOrder } = useRejectDelivery();

  // Active assigned deliveries (accepted, picked_up, in_transit)
  const {
    data: activeOrders = [],
    isLoading: activeLoading,
  } = useAssignedDeliveries(!!driverId);

  const updateDeliveryStatus = useUpdateDeliveryStatus();

  const isLoading = activeLoading || availableLoading;

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

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await acceptOrder(id);
      setNotification({ type: 'success', message: '¡Pedido aceptado con éxito!' });
    } catch {
      setNotification({ type: 'error', message: 'Error al aceptar el pedido' });
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await rejectOrder(id);
      setNotification({ type: 'info', message: 'Pedido rechazado' });
    } catch {
      setNotification({ type: 'error', message: 'Error al rechazar el pedido' });
    }
  };

  const getActionForOrder = (orderStatus: string) => {
    switch (orderStatus) {
      case 'accepted':
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
      
      {/* Premium Welcome Header Card */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Abstract light leak overlay */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-teal-300/20 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-lg">
              <Bike className="size-9 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                ¡Hola, {firstName}! <Sparkles className="size-6 text-yellow-300 animate-pulse fill-yellow-300/20" />
              </h2>
              <p className="text-xs text-white/80 font-medium mt-1">
                {activeOrders.length > 0 
                  ? `Tienes ${activeOrders.length} entrega${activeOrders.length > 1 ? 's' : ''} activa${activeOrders.length > 1 ? 's' : ''} en curso. ¡Que tengas una gran ruta!`
                  : 'No tienes entregas asignadas actualmente. ¡Conéctate para recibir pedidos!'}
              </p>
            </div>
          </div>
          
          {/* Live system state tag */}
          <div className="relative z-10 shrink-0 self-start md:self-center flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-xs font-black shadow-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>Sistema en línea Managua</span>
          </div>
        </div>
      </motion.div>

      {/* Availability Status Toggle Card */}
      <GlassCard className="col-span-12 md:col-span-4" variants={fadeUp}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex size-14 items-center justify-center rounded-full',
              localAvailable ? 'bg-emerald-500/10' : 'bg-slate-500/10',
            )}>
              <CircleDot className={cn(
                'size-6',
                localAvailable ? 'text-emerald-500 animate-pulse' : 'text-slate-400',
              )} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground">
                {localAvailable ? 'Conectado' : 'Desconectado'}
              </p>
              <p className="text-xs text-muted-foreground">
                {localAvailable ? 'Recibiendo pedidos en vivo' : 'Fuera de servicio'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocalAvailable(!localAvailable)}
            className={cn(
              'w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer text-center',
              localAvailable 
                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            )}
          >
            {localAvailable ? 'Desconectar' : 'Conectar'}
          </button>
        </div>
      </GlassCard>

      {/* Stats Card: Earnings */}
      <GlassCard className="col-span-12 sm:col-span-6 md:col-span-4" variants={fadeUp}>
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <DollarSign className="size-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {formatCurrency(stats?.totalEarnings ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats?.totalDeliveries ?? 0} Entregas Completadas
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Stats Card: Rating */}
      <GlassCard className="col-span-12 sm:col-span-6 md:col-span-4" variants={fadeUp}>
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
            <Star className="size-6 fill-teal-500/30" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {stats?.rating ?? 5.0} / 5.0
            </p>
            <p className="text-xs text-muted-foreground">Reputación Excelente ⭐</p>
          </div>
        </div>
      </GlassCard>

      {/* Column 1: Available Freelance Orders */}
      <div className="col-span-12 lg:col-span-6 space-y-4">
        <GlassCard className="h-full" variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-base font-extrabold text-foreground">Pedidos Disponibles (Freelance)</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-muted-foreground">
              {availableOrders.length} disponibles
            </span>
          </div>

          {!localAvailable ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Bike className="size-12 text-muted-foreground/30 mb-3" />
              <h4 className="text-sm font-bold text-foreground">Estás fuera de servicio</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Conéctate con el botón superior para ver y aceptar pedidos en Managua.
              </p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Activity className="size-12 text-teal-500/40 animate-pulse mb-3" />
              <h4 className="text-sm font-bold text-foreground">Buscando nuevos pedidos...</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Te notificaremos tan pronto una farmacia emita una receta para entrega.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              <AnimatePresence>
                {availableOrders.map((order: any) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-2xl border border-border/50 glass hover:border-teal-500/30 transition-all"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            Fármacos a Bordo
                          </span>
                          <h4 className="text-sm font-bold text-foreground mt-1.5">{order.pharmacy?.name}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-teal-500">
                            + {formatCurrency(order.deliveryFee || 60)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Tarifa de envío</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span><b>Origen:</b> {order.pharmacy?.address}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Navigation className="size-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <span><b>Destino:</b> {order.deliveryAddress}</span>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-slate-500/5 border border-border/30">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Items:</p>
                          <p className="text-xs text-foreground truncate">
                            {order.items.map((i: any) => `${i.name || 'Medicina'} (x${i.quantity})`).join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => handleAccept(e, order.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-[0_2px_10px_rgba(20,184,166,0.2)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="size-3.5" /> Aceptar Pedido
                        </button>
                        <button
                          onClick={(e) => handleReject(e, order.id)}
                          className="py-2 px-3 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 text-muted-foreground hover:text-foreground font-bold text-xs border border-border/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="size-3.5" /> Rechazar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Column 2: Assigned Active Orders */}
      <div className="col-span-12 lg:col-span-6 space-y-4">
        <GlassCard className="h-full" variants={fadeUp}>
          <h3 className="text-base font-extrabold text-foreground mb-4">Tus Entregas Asignadas</h3>
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Truck className="size-12 text-muted-foreground/30 mb-3" />
              <h4 className="text-sm font-bold text-foreground">Sin entregas asignadas</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Acepta un pedido de la lista de disponibles para iniciar la ruta y ganar créditos Oasis.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
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
                      className="p-4 rounded-2xl glass hover:bg-teal-500/5 transition-all cursor-pointer border border-border/40"
                      onClick={() => navigate('delivery-detail', order.id)}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-foreground truncate">
                              {order.pharmacy?.name || 'Farmacia'}
                            </h4>
                            <div className="mt-1 flex items-center gap-1.5">
                              <StatusBadge status={order.status} type="delivery" />
                              {(order as any).cashOnDelivery > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase">
                                  Cobro en efectivo
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-foreground">
                              {formatCurrency(totalAmount || 180)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Total del Pedido</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>{order.delivery_address}</span>
                          </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Package className="size-3.5" />
                            <span className="truncate">
                              {order.items.map((i) => `${i.medicine?.name || 'Med'} x${i.quantity}`).join(', ')}
                            </span>
                          </div>
                        )}

                        {action && (
                          <div className="pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleStatusUpdate(order.id, action.newStatus)}
                              disabled={updatingId === order.id}
                              className={cn(
                                'w-full gap-2 rounded-xl px-4 py-2.5 text-xs font-black flex items-center justify-center cursor-pointer shadow-md',
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
      </div>

    </motion.div>
  );
}
