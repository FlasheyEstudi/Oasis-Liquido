'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
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
                <CircleCheck className="size-5 text-emerald-500 shrink-0" />
              ) : isCurrent && !isCancelled ? (
                <CircleDot className="size-5 text-amber-500 shrink-0 animate-pulse" />
              ) : (
                <Circle className={cn(
                  'size-5 shrink-0',
                  isCancelled ? 'text-red-300' : 'text-gray-300'
                )} />
              )}
              {index < DELIVERY_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8',
                    isCompleted ? 'bg-emerald-400' : isCancelled ? 'bg-red-200' : 'bg-gray-200'
                  )}
                />
              )}
            </div>

            {/* Text */}
            <div className="pb-6 last:pb-0">
              <p className={cn(
                'text-sm font-medium',
                isCompleted ? 'text-emerald-700' :
                isCurrent && !isCancelled ? 'text-amber-700' :
                isCancelled ? 'text-red-400 line-through' :
                'text-gray-400'
              )}>
                {step.label}
              </p>
              <p className={cn(
                'text-xs',
                isCompleted ? 'text-emerald-600' :
                isCurrent && !isCancelled ? 'text-amber-600' :
                'text-gray-400'
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

/** Expanded order detail with tracking */
function OrderDetail({ order }: { order: DeliveryOrder }) {
  // Use tracking hook with polling for active orders
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
  const trackingQuery = useDeliveryOrderTracking(isActive ? order.id : '');
  const routeQuery = useDeliveryRoute(order.id, isActive);

  // Use tracking data if available (more up-to-date), fall back to original order
  const currentOrder = trackingQuery.data ?? order;
  const route = routeQuery.data;

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
    const driverProfile = currentOrder.driver?.delivery_driver_profile || (currentOrder.driver as any)?.deliveryDriverProfile;
    if (isActive && driverProfile?.current_lat && driverProfile?.current_lng) {
      markers.push({
        id: `driver-${currentOrder.id}`,
        lat: driverProfile.current_lat,
        lng: driverProfile.current_lng,
        type: 'driver',
        label: currentOrder.driver?.name || 'Repartidor',
      });
    }
    return markers;
  }, [currentOrder, isActive]);

  const mapCenter = useMemo((): [number, number] => [
    currentOrder.delivery_lat || DEFAULT_LAT, 
    currentOrder.delivery_lng || DEFAULT_LNG
  ], [currentOrder.delivery_lat, currentOrder.delivery_lng]);

  const orderTotal = useMemo(() => currentOrder.items?.reduce(
    (sum, i) => sum + i.quantity * i.unit_price,
    0
  ) || 0, [currentOrder.items]);

  return (
    <div className="space-y-4">
      {/* Map for active deliveries */}
      {mapMarkers.length > 0 && (
        <div className="relative rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl">
          <MapView
            markers={mapMarkers}
            center={mapCenter}
            height="280px"
            theme="dark"
            showUserLocation
            route={route ? { geometry: route.geometry } : null}
          />
          {/* Real-time overlay tag */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">En Vivo</span>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <StatusTimeline currentStatus={currentOrder.status} />

      {/* Estimated delivery */}
      {(currentOrder.status === 'in_transit' || currentOrder.status === 'picked_up') && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-medium text-amber-800">
            Tiempo estimado de entrega: 15-30 minutos
          </p>
        </div>
      )}

      {/* Driver info */}
      {currentOrder.driver && (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <Truck className="size-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{currentOrder.driver.name}</p>
            <p className="text-xs text-gray-500">Repartidor</p>
          </div>
          {currentOrder.driver.phone && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
            >
              <Phone className="size-3" />
              Llamar
            </Button>
          )}
        </div>
      )}

      {/* Items list */}
      {currentOrder.items && currentOrder.items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700">Productos</p>
          {currentOrder.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 truncate">
                  {item.medicine?.name || 'Medicamento'}
                </p>
                <p className="text-xs text-gray-400">
                  {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="font-medium text-gray-700 shrink-0 ml-2">
                {formatCurrency(item.quantity * item.unit_price)}
              </p>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-sm font-bold text-emerald-700">
              {formatCurrency(orderTotal)}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {currentOrder.notes && (
        <div className="rounded-lg bg-gray-50 p-2.5">
          <p className="text-xs text-gray-500 font-medium">Notas:</p>
          <p className="text-xs text-gray-700">{currentOrder.notes}</p>
        </div>
      )}

      {/* Pharmacy info */}
      {currentOrder.pharmacy && (
        <div className="text-xs text-gray-500">
          Farmacia: {currentOrder.pharmacy.name} · {currentOrder.pharmacy.address}
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
  const orders = ordersQuery.data?.data ?? [];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Mis Pedidos</h2>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Navigation className="size-4 text-emerald-600" />
            Pedidos Activos ({activeOrders.length})
          </h3>
          {activeOrders.map((order) => {
            const isExpanded = effectiveExpandedId === order.id;

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Collapsed header */}
                  <button
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
                        <Truck className="size-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {order.pharmacy?.name || 'Farmacia'}
                          </p>
                          <StatusBadge status={order.status} type="delivery" />
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 truncate flex items-center gap-1">
                          <MapPin className="size-3 shrink-0" />
                          {order.delivery_address}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="size-3" />
                          {formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}
                          <span>•</span>
                          <span>
                            {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="size-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="size-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3">
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
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="size-4 text-gray-500" />
            Historial ({pastOrders.length})
          </h3>
          {pastOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const orderTotal = order.items?.reduce(
              (sum, i) => sum + i.quantity * i.unit_price,
              0
            ) || 0;

            return (
              <Card key={order.id} className="overflow-hidden opacity-80">
                <CardContent className="p-0">
                  <button
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Package className="size-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {order.pharmacy?.name || 'Farmacia'}
                          </p>
                          <StatusBadge status={order.status} type="delivery" />
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 truncate flex items-center gap-1">
                          <MapPin className="size-3 shrink-0" />
                          {order.delivery_address}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="size-3" />
                          {formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}
                          <span>•</span>
                          <span>{formatCurrency(orderTotal)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="size-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="size-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-3">
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700">Productos</p>
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <p className="text-gray-700 truncate">
                                {item.medicine?.name || 'Medicamento'} × {item.quantity}
                              </p>
                              <p className="font-medium text-gray-600 shrink-0 ml-2">
                                {formatCurrency(item.quantity * item.unit_price)}
                              </p>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm font-semibold text-gray-900">Total</span>
                            <span className="text-sm font-bold text-gray-700">
                              {formatCurrency(orderTotal)}
                            </span>
                          </div>
                        </div>
                      )}
                      {order.status === 'delivered' && (
                        <Button
                          size="sm"
                          className="w-full rounded-xl bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 border-teal-500/20"
                          onClick={() => setReviewOrder(order)}
                        >
                          Calificar Reparto
                        </Button>
                      )}
                      {order.delivered_at && (
                        <p className="text-xs text-gray-500 text-center">
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
