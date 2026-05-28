'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { getSocket, joinOrderRoom } from '@/lib/socket';
import { useEffect } from 'react';
import {
  useDeliveryOrders,
  useDeliveryOrderTracking,
  useDeliveryRoute,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { DeliveryOrder, DeliveryStatus } from '@/types';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { ReviewModal } from '@/components/oasis/review-modal';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import { MapView } from '@/components/common/map-view';
import type { MapMarker } from '@/components/common/map-view';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorBlock } from '@/components/common/error-block';
import { cn } from '@/lib/utils';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Phone,
  Navigation,
  CircleCheck,
  CircleDot,
  Circle,
  Star,
  ShieldCheck,
  CheckCircle2,
  HeartPulse,
  Sparkles,
} from 'lucide-react';

/** Status timeline steps for delivery */
const DELIVERY_STEPS: { status: DeliveryStatus; label: string; description: string }[] = [
  { status: 'pending', label: 'Pendiente', description: 'Pedido recibido' },
  { status: 'assigned', label: 'Asignado', description: 'Repartidor asignado' },
  { status: 'picked_up', label: 'Recogido', description: 'Paquete en camino' },
  { status: 'in_transit', label: 'En tránsito', description: 'Acercándose al destino' },
  { status: 'delivered', label: 'Entregado', description: 'Paquete entregado' },
];

const STEP_ORDER: DeliveryStatus[] = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'];

function getStepIndex(status: DeliveryStatus): number {
  const idx = STEP_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

/** Timeline visualization component */
function StatusTimeline({ currentStatus }: { currentStatus: DeliveryStatus }) {
  const currentIndex = getStepIndex(currentStatus);

  const getStepIcon = (status: DeliveryStatus, className: string) => {
    switch (status) {
      case 'pending':
        return <Package className={className} />;
      case 'assigned':
        return <ShieldCheck className={className} />;
      case 'picked_up':
        return <HeartPulse className={className} />;
      case 'in_transit':
        return <Truck className={className} />;
      case 'delivered':
        return <CheckCircle2 className={className} />;
      default:
        return <Circle className={className} />;
    }
  };

  return (
    <div className="py-4 bg-white/5 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 rounded-3xl p-5 shadow-inner">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2.5">
        <Sparkles className="size-4 text-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Estado del Envío Bioseguro</span>
      </div>

      <div className="relative pl-1">
        {DELIVERY_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isCancelled = currentStatus === 'cancelled';

          return (
            <div key={step.status} className="flex items-start gap-4 relative">
              {/* Connector Line */}
              {index < DELIVERY_STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute left-5 top-10 w-0.5 h-10 -ml-[1px] transition-all duration-500',
                    isCompleted
                      ? 'bg-gradient-to-b from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : isCancelled
                      ? 'bg-red-500/25'
                      : 'bg-slate-200 dark:bg-zinc-800'
                  )}
                />
              )}

              {/* Icon Badge */}
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-2xl border transition-all duration-500 z-10 shadow-md',
                  isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 shadow-emerald-500/5 scale-100'
                    : isCurrent && !isCancelled
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.25)] scale-110'
                    : isCancelled
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-650'
                )}
              >
                {getStepIcon(step.status, 'size-4.5 shrink-0')}
              </div>

              {/* Text */}
              <div className="pb-8 last:pb-0 pt-1.5 flex-1 min-w-0">
                <p
                  className={cn(
                    'text-xs font-black uppercase tracking-wider transition-colors',
                    isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isCurrent && !isCancelled
                      ? 'text-amber-500 animate-pulse font-extrabold'
                      : isCancelled
                      ? 'text-red-400/60 line-through'
                      : 'text-slate-450 dark:text-zinc-500'
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    'text-[11px] font-semibold mt-0.5 transition-colors leading-relaxed',
                    isCompleted
                      ? 'text-slate-500 dark:text-zinc-400'
                      : isCurrent && !isCancelled
                      ? 'text-slate-700 dark:text-zinc-200 font-bold'
                      : 'text-slate-400 dark:text-zinc-550'
                  )}
                >
                  {isCancelled && isCurrent ? 'Pedido cancelado' : step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Helper to normalize database fields from both camelCase (Prisma default) and snake_case API versions */
function normalizeOrder(order: any): any {
  if (!order) return null;

  const pickup_lat = order.pickup_lat ?? order.pickupLat;
  const pickup_lng = order.pickup_lng ?? order.pickupLng;
  const delivery_lat = order.delivery_lat ?? order.deliveryLat;
  const delivery_lng = order.delivery_lng ?? order.deliveryLng;
  const pickup_address = order.pickup_address ?? order.pickupAddress;
  const delivery_address = order.delivery_address ?? order.deliveryAddress;
  const order_date = order.order_date ?? order.orderDate;

  const driver = order.driver ?? order.deliveryDriver;
  const driverProfile = driver?.delivery_driver_profile ?? driver?.deliveryDriverProfile;

  const rawItems = order.items ?? order.sale?.saleItems ?? [];
  const items = rawItems.map((item: any) => ({
    ...item,
    unit_price: item.unit_price ?? item.unitPrice,
    medicine: item.medicine ?? item.medicine,
  }));

  return {
    ...order,
    pickup_lat,
    pickup_lng,
    delivery_lat,
    delivery_lng,
    pickup_address,
    delivery_address,
    order_date,
    driver: driver ? {
      ...driver,
      delivery_driver_profile: driverProfile ? {
        ...driverProfile,
        current_lat: driverProfile.current_lat ?? driverProfile.currentLat,
        current_lng: driverProfile.current_lng ?? driverProfile.currentLng,
      } : null
    } : null,
    items
  };
}

/** Expanded order detail with tracking */
function OrderDetail({ order: rawOrder }: { order: DeliveryOrder }) {
  const order = useMemo(() => normalizeOrder(rawOrder), [rawOrder]);
  
  // Use tracking hook with polling for active orders
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
  const trackingQuery = useDeliveryOrderTracking(isActive ? order.id : '');
  const routeQuery = useDeliveryRoute(order.id, isActive);

  // Use tracking data if available (more up-to-date), fall back to original order
  const currentOrder = useMemo(() => {
    const raw = trackingQuery.data ?? order;
    return normalizeOrder(raw);
  }, [trackingQuery.data, order]);

  const route = routeQuery.data;

  // Real-time driver location state
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (isActive) {
      joinOrderRoom(order.id);
      const socket = getSocket();

      const handleLocationUpdate = (data: { orderId: string, lat: number, lng: number }) => {
        if (data.orderId === order.id) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        }
      };

      socket.on('delivery:locationUpdate', handleLocationUpdate);
      
      return () => {
        socket.off('delivery:locationUpdate', handleLocationUpdate);
      };
    }
  }, [order.id, isActive]);

  // Build map markers
  const mapMarkers = useMemo(() => {
    const markers: MapMarker[] = [];
    if (currentOrder.pickup_lat && currentOrder.pickup_lng) {
      markers.push({
        id: `pickup-${currentOrder.id}`,
        lat: currentOrder.pickup_lat,
        lng: currentOrder.pickup_lng,
        type: 'pharmacy',
        label: `${currentOrder.pharmacy?.name || 'Farmacia'} (origen)`,
      });
    }
    if (currentOrder.delivery_lat && currentOrder.delivery_lng) {
      markers.push({
        id: `dest-${currentOrder.id}`,
        lat: currentOrder.delivery_lat,
        lng: currentOrder.delivery_lng,
        type: 'destination',
        label: 'Tu ubicación',
      });
    }
    // Add driver marker if in transit
    const driverProfile = currentOrder.driver?.delivery_driver_profile;
    const lat = driverLocation?.lat || driverProfile?.current_lat;
    const lng = driverLocation?.lng || driverProfile?.current_lng;

    if (isActive && lat && lng) {
      markers.push({
        id: `driver-${currentOrder.id}`,
        lat,
        lng,
        type: 'driver',
        label: currentOrder.driver?.name || 'Repartidor',
      });
    }
    return markers;
  }, [currentOrder, isActive, driverLocation]);

  const mapCenter = useMemo((): [number, number] => [
    currentOrder.delivery_lat || DEFAULT_LAT, 
    currentOrder.delivery_lng || DEFAULT_LNG
  ], [currentOrder.delivery_lat, currentOrder.delivery_lng]);

  const orderTotal = useMemo(() => currentOrder.items?.reduce(
    (sum: number, i: any) => sum + i.quantity * i.unit_price,
    0
  ) || 0, [currentOrder.items]);

  return (
    <div className="space-y-6">
      {/* Map for active deliveries */}
      {mapMarkers.length > 0 && (
        <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl bg-white dark:bg-zinc-950 transition-colors duration-300">
          <MapView
            markers={mapMarkers}
            center={mapCenter}
            height="300px"
            showUserLocation
            route={route ? { geometry: route.geometry } : null}
          />
          {/* Real-time overlay tag */}
          <div className="absolute top-4 left-4 z-10 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center gap-2 shadow-lg transition-all duration-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">GPS Telemetría Activa</span>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <StatusTimeline currentStatus={currentOrder.status} />

      {/* Estimated delivery */}
      {(currentOrder.status === 'in_transit' || currentOrder.status === 'picked_up') && (
        <div className="rounded-3xl bg-amber-500/[0.07] border border-amber-500/20 p-4.5 space-y-2 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 animate-pulse">
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
              Entrega Estimada: 15-30 minutos
            </p>
          </div>
          <p className="text-[10px] text-amber-600/80 leading-relaxed font-semibold italic pl-11">
            ⚠️ Tu medicina es transportada en compartimientos térmicos certificados para mantener la eficacia biológica de la fórmula.
          </p>
        </div>
      )}

      {/* Driver info (Caregiver Pilot Badge) */}
      {currentOrder.driver && (
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-950 dark:to-zinc-900 border border-slate-200 dark:border-white/5 p-4 sm:p-5 rounded-[2rem] shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 dark:bg-teal-400/[0.02] rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Pulsing Pilot Avatar frame */}
            <div className="relative size-14 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/10">
              <div className="size-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center font-black text-teal-600 text-sm">
                {currentOrder.driver.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 justify-center sm:justify-start">
                <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                  {currentOrder.driver.name}
                </p>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  <Star className="size-2.5 fill-amber-500" />
                  <span>4.9 Certificado</span>
                </div>
              </div>
              
              <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1">
                Repartidor de Salud Oasis
              </p>
              
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1">
                Equipado con equipo de protección y termo de bioseguridad
              </p>
            </div>

            {currentOrder.driver.phone && (
              <Button
                size="sm"
                className="h-10 px-5 rounded-full bg-teal-500 hover:bg-teal-600 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20 border border-teal-500/20 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/10 w-full sm:w-auto transition-all duration-300"
                asChild
              >
                <a href={`tel:${currentOrder.driver.phone}`}>
                  <Phone className="size-3.5 fill-current" />
                  Llamar Repartidor
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Items list (Clinical Translucent Receipt) */}
      {currentOrder.items && currentOrder.items.length > 0 && (
        <div className="space-y-4 bg-slate-500/[0.02] dark:bg-zinc-950/20 border border-slate-200 dark:border-white/5 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden transition-colors duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">Medicamentos Despachados</span>
            <span className="text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Verificados</span>
          </div>

          <div className="space-y-3.5 py-1">
            {currentOrder.items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 dark:text-white font-extrabold truncate">
                    {item.medicine?.name || 'Medicamento'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono font-semibold mt-0.5">
                    {item.quantity} un × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-extrabold text-slate-800 dark:text-white font-mono shrink-0 ml-2">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-3.5 border-t border-dashed border-slate-200 dark:border-white/10 font-bold">
            <span className="text-xs text-slate-500 dark:text-zinc-450 uppercase font-black tracking-widest">Total Factura</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono shadow-sm">
              {formatCurrency(orderTotal)}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {currentOrder.notes && (
        <div className="rounded-2xl bg-slate-500/[0.01] dark:bg-zinc-950/20 border border-slate-200 dark:border-white/5 p-4 transition-colors duration-300">
          <p className="text-[9px] font-black text-slate-500 dark:text-zinc-450 uppercase tracking-widest mb-1.5">Notas del Paciente:</p>
          <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold leading-relaxed">{currentOrder.notes}</p>
        </div>
      )}

      {/* Pharmacy info */}
      {currentOrder.pharmacy && (
        <div className="text-[10px] text-slate-450 dark:text-zinc-550 font-black uppercase tracking-wider px-1 text-center">
          Despachado en: <span className="text-slate-600 dark:text-zinc-450">{currentOrder.pharmacy.name}</span>
        </div>
      )}
    </div>
  );
}

export function OrderTracking() {
  const { navigate } = useAuthStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<DeliveryOrder | null>(null);

  const ordersQuery = useDeliveryOrders({});
  const rawOrders = ordersQuery.data?.data ?? [];
  
  // Normalize all orders mapping camelCase and custom relations correctly
  const orders = useMemo(() => rawOrders.map(normalizeOrder), [rawOrders]);

  // Separate active and past orders
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled'
  );

  // Auto-expand first active order
  const effectiveExpandedId = expandedId ?? (activeOrders.length > 0 ? activeOrders[0].id : null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (ordersQuery.isLoading) {
    return <LoadingSkeleton type="list" count={4} />;
  }

  if (ordersQuery.isError) {
    return (
      <ErrorBlock
        message={getHookErrorMessage(ordersQuery.error)}
        onRetry={() => ordersQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-7 max-w-2xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="size-6 text-teal-500 dark:text-teal-400 animate-pulse" />
            <span>Mis Pedidos Bioseguros</span>
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-1">
            Sigue en tiempo real tus tratamientos médicos despachados
          </p>
        </div>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 flex items-center gap-2 pl-1">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>Rastreo Activo ({activeOrders.length})</span>
          </h3>

          <div className="space-y-3.5">
            {activeOrders.map((order) => {
              const isExpanded = effectiveExpandedId === order.id;

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-950/20 rounded-[2.25rem] shadow-2xl backdrop-blur-md transition-all duration-300",
                    isExpanded && "ring-1 ring-teal-500/20 border-teal-500/10 shadow-[0_15px_30px_rgba(20,184,166,0.06)]"
                  )}
                >
                  <CardContent className="p-0">
                    {/* Collapsed header */}
                    <button
                      className="w-full p-5 sm:p-6 text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 shadow-md">
                          <Truck className="size-5 text-teal-600 dark:text-teal-400 animate-pulse" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-extrabold text-slate-800 dark:text-white truncate tracking-tight">
                              {order.pharmacy?.name || 'Farmacia'}
                            </p>
                            <StatusBadge status={order.status} type="delivery" />
                          </div>
                          
                          <p className="mt-1 text-xs text-slate-550 dark:text-zinc-400 truncate flex items-center gap-1.5 font-medium leading-none">
                            <MapPin className="size-3.5 shrink-0 text-red-500" />
                            {order.delivery_address}
                          </p>
                          
                          <div className="mt-3 flex items-center gap-2.5 text-[10px] text-slate-400 dark:text-zinc-550 font-black uppercase tracking-wider">
                            <Clock className="size-3.5" />
                            <span>{formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}</span>
                            <span>•</span>
                            <span className="text-slate-550 dark:text-zinc-400">
                              {order.items?.length || 0} medicamento{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className="size-5 text-slate-400 dark:text-zinc-600" />
                          ) : (
                            <ChevronDown className="size-5 text-slate-400 dark:text-zinc-600" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-200 dark:border-white/5 px-5 sm:px-6 pb-6 pt-5"
                        >
                          <OrderDetail order={order} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 flex items-center gap-2 pl-1">
            <Package className="size-4 text-slate-400 dark:text-zinc-500" />
            <span>Historial de Envíos ({pastOrders.length})</span>
          </h3>

          <div className="space-y-3">
            {pastOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const orderTotal = order.items?.reduce(
                (sum: number, i: any) => sum + i.quantity * i.unit_price,
                0
              ) || 0;

              return (
                <Card
                  key={order.id}
                  className="overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50/20 dark:bg-zinc-950/10 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 opacity-90 hover:opacity-100"
                >
                  <CardContent className="p-0">
                    <button
                      className="w-full p-5 text-left hover:bg-slate-100/30 dark:hover:bg-white/[0.01] transition-colors"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5">
                          <Package className="size-4.5 text-slate-400 dark:text-zinc-550" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-extrabold text-slate-700 dark:text-zinc-300 truncate">
                              {order.pharmacy?.name || 'Farmacia'}
                            </p>
                            <StatusBadge status={order.status} type="delivery" />
                          </div>
                          
                          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-450 truncate flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            {order.delivery_address}
                          </p>
                          
                          <div className="mt-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-600">
                            <Clock className="size-3.5" />
                            <span>{formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}</span>
                            <span>•</span>
                            <span className="font-extrabold text-slate-700 dark:text-zinc-400">
                              {formatCurrency(orderTotal)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className="size-5 text-slate-400 dark:text-zinc-650" />
                          ) : (
                            <ChevronDown className="size-5 text-slate-400 dark:text-zinc-650" />
                          )}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-200 dark:border-white/5 px-5 pb-5 pt-4 space-y-4"
                        >
                          {order.items && order.items.length > 0 && (
                            <div className="space-y-3 bg-slate-500/[0.01] dark:bg-zinc-950/20 border border-slate-200 dark:border-white/5 rounded-2xl p-4 transition-colors">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-550">Productos Despachados</p>
                              
                              <div className="space-y-2.5">
                                {order.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <p className="text-slate-700 dark:text-zinc-350 font-bold truncate">
                                      {item.medicine?.name || 'Medicamento'} × {item.quantity}
                                    </p>
                                    <p className="font-extrabold text-slate-800 dark:text-white shrink-0 ml-2 font-mono">
                                      {formatCurrency(item.quantity * item.unit_price)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex justify-between pt-3 border-t border-dashed border-slate-200 dark:border-white/10 font-bold">
                                <span className="text-xs text-slate-500 dark:text-zinc-450 uppercase font-black tracking-widest">Total Facturado</span>
                                <span className="text-xs font-black text-slate-800 dark:text-white font-mono">
                                  {formatCurrency(orderTotal)}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {order.status === 'delivered' && (
                            <Button
                              size="sm"
                              className="w-full rounded-full bg-teal-500/10 dark:bg-teal-500/10 text-teal-650 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 font-black h-10 transition-colors uppercase tracking-widest text-[10px]"
                              onClick={() => setReviewOrder(order)}
                            >
                              Calificar Reparto Bioseguro
                            </Button>
                          )}
                          
                          {order.delivered_at && (
                            <p className="text-[10px] text-slate-400 dark:text-zinc-600 text-center font-mono font-semibold">
                              Entregado: {formatDate(order.delivered_at, 'dd/MM/yyyy HH:mm')}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {reviewOrder && (
        <ReviewModal
          isOpen={!!reviewOrder}
          onClose={() => setReviewOrder(null)}
          targetName={reviewOrder.driver?.name || 'Repartidor'}
          targetType="delivery"
          onSubmit={(r, c) => {
            console.log('Delivery review:', r, c);
            toast.success('¡Gracias por calificar al repartidor!');
          }}
        />
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <EmptyState
          icon={Package}
          title="Sin pedidos registrados"
          description="Aún no tienes pedidos de domicilio. Busca una farmacia acreditada en tu área y realiza tu primer pedido de inmediato."
          actionLabel="Buscar Farmacias"
          onAction={() => navigate('pharmacy-map')}
        />
      )}
    </div>
  );
}
