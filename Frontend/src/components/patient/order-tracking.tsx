'use client';

import { useState, useMemo } from 'react';
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

  return (
    <div className="py-2">
      {DELIVERY_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isCancelled = currentStatus === 'cancelled';

        return (
          <div key={step.status} className="flex items-start gap-3">
            {/* Dot + Line */}
            <div className="flex flex-col items-center">
              {isCompleted ? (
                <CircleCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : isCurrent && !isCancelled ? (
                <CircleDot className="size-5 text-amber-500 dark:text-amber-400 shrink-0 animate-pulse" />
              ) : (
                <Circle className={cn(
                  'size-5 shrink-0',
                  isCancelled ? 'text-red-400' : 'text-slate-300 dark:text-zinc-700'
                )} />
              )}
              {index < DELIVERY_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8',
                    isCompleted ? 'bg-emerald-500' : isCancelled ? 'bg-red-900/50' : 'bg-slate-200 dark:bg-zinc-800'
                  )}
                />
              )}
            </div>

            {/* Text */}
            <div className="pb-6 last:pb-0">
              <p className={cn(
                'text-sm font-bold transition-colors',
                isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                isCurrent && !isCancelled ? 'text-amber-600 dark:text-amber-400 animate-pulse' :
                isCancelled ? 'text-red-400/60 line-through' :
                'text-slate-400 dark:text-zinc-500'
              )}>
                {step.label}
              </p>
              <p className={cn(
                'text-xs mt-0.5 transition-colors',
                isCompleted ? 'text-emerald-600/85 dark:text-emerald-400/85' :
                isCurrent && !isCancelled ? 'text-amber-600/85 dark:text-amber-400/85 font-semibold' :
                'text-slate-400 dark:text-zinc-500'
              )}>
                {isCancelled && isCurrent ? 'Pedido cancelado' : step.description}
              </p>
            </div>
          </div>
        );
      })}
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
    <div className="space-y-5">
      {/* Map for active deliveries */}
      {mapMarkers.length > 0 && (
        <div className="relative rounded-[2rem] overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 transition-colors duration-300">
          <MapView
            markers={mapMarkers}
            center={mapCenter}
            height="280px"
            showUserLocation
            route={route ? { geometry: route.geometry } : null}
          />
          {/* Real-time overlay tag */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center gap-2 transition-all duration-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">En Vivo</span>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <StatusTimeline currentStatus={currentOrder.status} />

      {/* Estimated delivery */}
      {(currentOrder.status === 'in_transit' || currentOrder.status === 'picked_up') && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-3">
          <Clock className="size-5 text-amber-600 dark:text-amber-500 animate-pulse shrink-0" />
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Tiempo estimado de entrega: 15-30 minutos
          </p>
        </div>
      )}

      {/* Driver info */}
      {currentOrder.driver && (
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl transition-colors duration-300">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/50">
            <Truck className="size-5 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{currentOrder.driver.name}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-500">Repartidor asignado</p>
          </div>
          {currentOrder.driver.phone && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 rounded-xl border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center gap-1.5 text-xs font-bold transition-colors"
              asChild
            >
              <a href={`tel:${currentOrder.driver.phone}`}>
                <Phone className="size-3.5 fill-slate-700 dark:fill-zinc-200" />
                Llamar
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Items list */}
      {currentOrder.items && currentOrder.items.length > 0 && (
        <div className="space-y-3 bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-850/50 rounded-2xl p-4 transition-colors duration-300">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-2 border-b border-slate-200 dark:border-zinc-850">
            Productos del Pedido
          </p>
          <div className="space-y-3.5">
            {currentOrder.items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 dark:text-zinc-200 font-semibold truncate">
                    {item.medicine?.name || 'Medicamento'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                    {item.quantity} un × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-bold text-slate-600 dark:text-zinc-300 font-mono shrink-0 ml-2">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-zinc-850 font-bold">
            <span className="text-xs text-slate-500 dark:text-zinc-400">Total</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(orderTotal)}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {currentOrder.notes && (
        <div className="rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850/50 p-3.5 transition-colors duration-300">
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Notas:</p>
          <p className="text-xs text-slate-700 dark:text-zinc-300">{currentOrder.notes}</p>
        </div>
      )}

      {/* Pharmacy info */}
      {currentOrder.pharmacy && (
        <div className="text-xs text-slate-450 dark:text-zinc-500 font-medium px-1">
          Farmacia: <span className="text-slate-600 dark:text-zinc-400">{currentOrder.pharmacy.name}</span> · <span className="text-slate-400 dark:text-zinc-600">{currentOrder.pharmacy.address}</span>
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800 transition-colors duration-300">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Mis Pedidos</h2>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            <Navigation className="size-4 text-emerald-500 animate-pulse" />
            Pedidos Activos ({activeOrders.length})
          </h3>
          {activeOrders.map((order) => {
            const isExpanded = effectiveExpandedId === order.id;

            return (
              <Card key={order.id} className="overflow-hidden border border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 rounded-[2rem] shadow-2xl backdrop-blur-sm transition-colors duration-300">
                <CardContent className="p-0">
                  {/* Collapsed header */}
                  <button
                    className="w-full p-5 text-left hover:bg-slate-100/50 dark:hover:bg-zinc-850/40 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <Truck className="size-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate">
                            {order.pharmacy?.name || 'Farmacia'}
                          </p>
                          <StatusBadge status={order.status} type="delivery" />
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 truncate flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0 text-red-500" />
                          {order.delivery_address}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-500 font-medium">
                          <Clock className="size-3.5" />
                          <span>{formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-400">
                            {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="size-5 text-slate-400 dark:text-zinc-550" />
                        ) : (
                          <ChevronDown className="size-5 text-slate-400 dark:text-zinc-550" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-zinc-850 px-5 pb-5 pt-4">
                      <OrderDetail order={order} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            <Package className="size-4 text-slate-500 dark:text-zinc-500" />
            Historial ({pastOrders.length})
          </h3>
          {pastOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const orderTotal = order.items?.reduce(
              (sum: number, i: any) => sum + i.quantity * i.unit_price,
              0
            ) || 0;

            return (
              <Card key={order.id} className="overflow-hidden border border-slate-200 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-950/20 rounded-[2rem] shadow-lg opacity-85 hover:opacity-100 transition-all duration-300">
                <CardContent className="p-0">
                  <button
                    className="w-full p-5 text-left hover:bg-slate-100/30 dark:hover:bg-zinc-850/30 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 transition-colors">
                        <Package className="size-5 text-slate-500 dark:text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-slate-800 dark:text-zinc-200 truncate">
                            {order.pharmacy?.name || 'Farmacia'}
                          </p>
                          <StatusBadge status={order.status} type="delivery" />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500 truncate flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          {order.delivery_address}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2.5 text-xs text-slate-400 dark:text-zinc-650 font-mono">
                          <Clock className="size-3.5" />
                          <span>{formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700 dark:text-zinc-400">{formatCurrency(orderTotal)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="size-5 text-slate-400 dark:text-zinc-550" />
                        ) : (
                          <ChevronDown className="size-5 text-slate-400 dark:text-zinc-550" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-zinc-900 px-5 pb-5 pt-4 space-y-4">
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-3 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-900 rounded-2xl p-4 transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-450">Productos</p>
                          <div className="space-y-2">
                            {order.items.map((item: any) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <p className="text-slate-750 dark:text-zinc-300 font-medium truncate">
                                  {item.medicine?.name || 'Medicamento'} × {item.quantity}
                                </p>
                                <p className="font-bold text-slate-650 dark:text-zinc-400 shrink-0 ml-2 font-mono">
                                  {formatCurrency(item.quantity * item.unit_price)}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-2.5 border-t border-slate-200 dark:border-zinc-850 font-bold">
                            <span className="text-xs text-slate-500 dark:text-zinc-400">Total</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">
                              {formatCurrency(orderTotal)}
                            </span>
                          </div>
                        </div>
                      )}
                      {order.status === 'delivered' && (
                        <Button
                          size="sm"
                          className="w-full rounded-xl bg-teal-500/10 dark:bg-teal-500/10 text-teal-650 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 font-bold h-10 transition-colors"
                          onClick={() => setReviewOrder(order)}
                        >
                          Calificar Reparto
                        </Button>
                      )}
                      {order.delivered_at && (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center font-mono">
                          Entregado: {formatDate(order.delivered_at, 'dd/MM/yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
          title="Sin pedidos"
          description="Aún no tienes pedidos de domicilio. Busca una farmacia y realiza tu primer pedido."
          actionLabel="Buscar farmacias"
          onAction={() => navigate('pharmacy-map')}
        />
      )}
    </div>
  );
}
