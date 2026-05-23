'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useDeliveryOrder,
  useDeliveryRoute,
  useUpdateDeliveryStatus,
  useUpdateDeliveryLocation,
} from '@/hooks/use-api';
import { formatDate, formatCurrency, formatDistance } from '@/utils/helpers';
import { DELIVERY_STATUS_CONFIG, DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { MapView } from '@/components/common/map-view';
import { DriverMap } from './DriverMap';
import type { MapMarker } from '@/components/common/map-view';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Navigation,
  PackageOpen,
  Truck,
  User,
  Building2,
  Route,
  Loader2,
  QrCode,
} from 'lucide-react';

// Status timeline steps for delivery
const STATUS_STEPS = [
  { key: 'pending', label: 'Pendiente', icon: Clock },
  { key: 'assigned', label: 'Asignada', icon: User },
  { key: 'picked_up', label: 'Recogido', icon: PackageOpen },
  { key: 'in_transit', label: 'En tránsito', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: CheckCircle2 },
];

function getStatusStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function DeliveryDetail() {
  const { selectedItemId, setNotification, navigate } = useAuthStore();

  // Verification states
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [patientQrCode, setPatientQrCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // React Query hooks
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useDeliveryOrder(selectedItemId || '', !!selectedItemId);

  const {
    data: route,
  } = useDeliveryRoute(selectedItemId || '', !!selectedItemId);

  const updateDeliveryStatus = useUpdateDeliveryStatus();
  const updateLocation = useUpdateDeliveryLocation();
  const isUpdating = updateDeliveryStatus.isPending;

  // Active GPS geolocation tracking when order is in_transit
  useEffect(() => {
    if (!order || order.status !== 'in_transit') return;

    let watchId: number | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const handleCoordsUpdate = (coords: GeolocationCoordinates) => {
      console.log('GPS Coordinates update:', coords.latitude, coords.longitude);
      updateLocation.mutate({
        orderId: order.id,
        lat: coords.latitude,
        lng: coords.longitude,
      });
    };

    if ('geolocation' in navigator) {
      // 1. watchPosition for active updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          handleCoordsUpdate(position.coords);
        },
        (error) => {
          console.warn('watchPosition failed:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // 2. Poll fallback every 10s via getCurrentPosition
      fallbackInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            handleCoordsUpdate(position.coords);
          },
          (error) => {
            console.warn('getCurrentPosition fallback failed:', error.message);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }, 10000);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (fallbackInterval !== null) {
        clearInterval(fallbackInterval);
      }
    };
  }, [order?.status, order?.id]);

  const handleStatusUpdate = (newStatus: 'picked_up' | 'in_transit' | 'delivered') => {
    if (!order) return;

    updateDeliveryStatus.mutate(
      { id: order.id, data: { status: newStatus } },
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
      }
    );
  };

  const handleConfirmDelivery = () => {
    if (!order) return;
    
    // Verify QR digital ID matches patient's digital ID
    const expectedId = `patient-id-${order.patient?.id}`;
    if (patientQrCode.trim() !== expectedId) {
      setVerificationError('Código QR incorrecto. No coincide con el ID digital de este paciente.');
      return;
    }

    setVerificationError('');
    updateDeliveryStatus.mutate(
      { 
        id: order.id, 
        data: { 
          status: 'delivered',
        } 
      },
      {
        onSuccess: () => {
          setNotification({ 
            type: 'success', 
            message: `Pedido entregado exitosamente a: ${receiverName || order.patient?.name}` 
          });
          setConfirmDeliveryOpen(false);
          setReceiverName('');
          setPatientQrCode('');
        },
        onError: () => {
          setNotification({ type: 'error', message: 'Error al confirmar la entrega' });
        },
      }
    );
  };

  if (orderLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6 max-w-2xl mx-auto">
        <div className="shimmer rounded-3xl h-12 w-40" />
        <div className="shimmer rounded-3xl h-40" />
        <div className="shimmer rounded-3xl h-64" />
        <div className="shimmer rounded-3xl h-48" />
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="space-y-4 p-4 md:p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('driver-home')}
          className="glass-btn-secondary rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <GlassCard className="text-center py-10">
          <MapPin className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {orderError ? 'Error al cargar el pedido' : 'Pedido no encontrado'}
          </p>
          <button onClick={() => refetchOrder()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm font-medium">
            Reintentar
          </button>
        </GlassCard>
      </div>
    );
  }

  const currentStepIndex = getStatusStepIndex(order.status);
  const totalAmount = order.items
    ? order.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    : 0;

  // Map markers
  const markers: MapMarker[] = [];
  if (order.pickup_lat && order.pickup_lng) {
    markers.push({
      id: `pickup-${order.id}`,
      lat: order.pickup_lat,
      lng: order.pickup_lng,
      type: 'pharmacy',
      label: `Farmacia: ${order.pharmacy?.name || 'Origen'}`,
    });
  }
  if (order.delivery_lat && order.delivery_lng) {
    markers.push({
      id: `dest-${order.id}`,
      lat: order.delivery_lat,
      lng: order.delivery_lng,
      type: 'destination',
      label: 'Destino de entrega',
    });
  }

  const mapCenter: [number, number] = markers.length > 0
    ? [markers[0].lat, markers[0].lng]
    : [DEFAULT_LAT, DEFAULT_LNG];

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-6">
      {/* Back button */}
      <motion.button
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('driver-home')}
        className="glass-btn-secondary rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2"
      >
        <ArrowLeft className="size-4" />
        Volver a entregas
      </motion.button>

      {/* Order Header */}
      <GlassCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-foreground">
              Pedido #{order.id?.slice(0, 8) || '...'}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.order_date, 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          <StatusBadge status={order.status} type="delivery" />
        </div>
      </GlassCard>

      {/* Map */}
      <GlassCard>
        <DriverMap order={order} height="280px" />
      </GlassCard>

      {/* Pickup & Delivery Details */}
      <GlassCard>
        <h3 className="text-base font-semibold text-foreground mb-4">Detalles del Envío</h3>

        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
            <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Origen (Farmacia)</p>
            <p className="text-sm font-semibold text-foreground">
              {order.pharmacy?.name || 'Farmacia'}
            </p>
            <p className="text-xs text-muted-foreground">{order.pickup_address || 'N/A'}</p>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center py-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-6 bg-border" />
            <MapPin className="size-4 text-muted-foreground/30" />
            <div className="w-px h-6 bg-border" />
          </div>
        </div>

        {/* Delivery */}
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-red-500/10 shrink-0">
            <MapPin className="size-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Destino</p>
            <p className="text-sm font-semibold text-foreground">{order.delivery_address}</p>
            {order.patient && (
              <p className="text-xs text-muted-foreground">
                {order.patient.name}
                {order.patient.phone && ` · ${order.patient.phone}`}
              </p>
            )}
          </div>
        </div>

        {order.notes && (
          <div className="p-3 rounded-2xl bg-amber-500/5 mt-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Nota: {order.notes}</p>
          </div>
        )}
      </GlassCard>

      {/* Status Timeline */}
      <GlassCard>
        <h3 className="text-base font-semibold text-foreground mb-4">Estado del Envío</h3>
        <div className="space-y-0">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-3">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full shrink-0 transition-all',
                      isCompleted
                        ? 'bg-teal-500/10'
                        : 'bg-muted',
                      isCurrent && 'ring-2 ring-teal-500 ring-offset-2 ring-offset-background',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4',
                        isCompleted ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground',
                      )}
                    />
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 h-8',
                        index < currentStepIndex ? 'bg-teal-500/30' : 'bg-border',
                      )}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className="pb-8 pt-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && order.status !== 'delivered' && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Estado actual</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Items */}
      <GlassCard>
        <h3 className="text-base font-semibold text-foreground mb-4">Artículos</h3>
        {order.items && order.items.length > 0 ? (
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl glass"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-sky-500/10">
                    <Package className="size-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.medicine?.name || 'Medicamento'}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 pt-2 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-base font-bold text-foreground">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sin artículos</p>
        )}
      </GlassCard>

      {/* Action Buttons */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="flex gap-3">
          {order.status === 'assigned' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-btn-primary rounded-full flex-1 h-12 gap-2 text-base font-medium flex items-center justify-center disabled:opacity-50"
              onClick={() => handleStatusUpdate('picked_up')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <PackageOpen className="size-5" />}
              {isUpdating ? 'Actualizando...' : 'Recoger pedido'}
            </motion.button>
          )}
          {order.status === 'picked_up' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-btn-primary rounded-full flex-1 h-12 gap-2 text-base font-medium flex items-center justify-center disabled:opacity-50"
              onClick={() => handleStatusUpdate('in_transit')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <Navigation className="size-5" />}
              {isUpdating ? 'Actualizando...' : 'Iniciar ruta'}
            </motion.button>
          )}
          {order.status === 'in_transit' && (
            <div className="flex flex-col gap-2 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full glass rounded-full flex-1 h-12 gap-2 text-base font-medium flex items-center justify-center border border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                onClick={() => setConfirmDeliveryOpen(true)}
                disabled={isUpdating}
              >
                <QrCode className="size-5 animate-pulse" />
                Escanear QR de entrega
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-btn-primary rounded-full flex-1 h-12 gap-2 text-base font-medium flex items-center justify-center disabled:opacity-50"
                onClick={() => setConfirmDeliveryOpen(true)}
                disabled={isUpdating}
              >
                <CheckCircle2 className="size-5" />
                Marcar como entregado
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      <AnimatePresence>
        {confirmDeliveryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <div className="size-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mx-auto mb-4 animate-bounce">
                  <QrCode className="size-10" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Confirmar Entrega Segura</h3>
                <p className="text-xs text-gray-400 mt-2">
                  Escanea el ID Digital del paciente <span className="font-bold text-teal-400">{order.patient?.name}</span> para verificar la entrega.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">¿Quién recibe?</label>
                  <input
                    placeholder="Ej. El propio paciente, madre, conyuge"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código QR o ID Digital de Paciente</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="patient-id-xxxx"
                      value={patientQrCode}
                      onChange={(e) => {
                        setPatientQrCode(e.target.value);
                        if (verificationError) setVerificationError('');
                      }}
                      className="flex-1 h-10 px-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                    <Button
                      size="sm"
                      className="bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-[10px] font-bold rounded-xl"
                      onClick={() => {
                        setPatientQrCode(`patient-id-${order.patient?.id}`);
                        setReceiverName(order.patient?.name || '');
                        setVerificationError('');
                      }}
                    >
                      Autollenar
                    </Button>
                  </div>
                  {verificationError && (
                    <p className="text-[10px] text-red-400 font-bold mt-1">{verificationError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-gray-400 hover:text-white" 
                  onClick={() => {
                    setConfirmDeliveryOpen(false);
                    setVerificationError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold"
                  disabled={!receiverName.trim() || !patientQrCode.trim() || isUpdating}
                  onClick={handleConfirmDelivery}
                >
                  {isUpdating ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Confirmar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
