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
  Sparkles,
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
  const { selectedItemId, setNotification, navigate, isElderlyMode } = useAuthStore();

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
          { enableHighAccuracy: true, timeout: 5005 }
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
    let scannedPatientId = patientQrCode.trim();
    if (scannedPatientId.includes('#patient-')) {
      const parts = scannedPatientId.split('#patient-');
      scannedPatientId = `patient-id-${parts[parts.length - 1]}`;
    } else if (scannedPatientId.includes('/verificar-paciente-')) {
      const parts = scannedPatientId.split('/verificar-paciente-');
      scannedPatientId = `patient-id-${parts[parts.length - 1]}`;
    } else if (scannedPatientId.includes('/verify#patient-')) {
      const parts = scannedPatientId.split('/verify#patient-');
      scannedPatientId = `patient-id-${parts[parts.length - 1]}`;
    }

    if (scannedPatientId !== expectedId) {
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
      <div className="delivery-container space-y-6 !max-w-2xl">
        <div className="shimmer rounded-full h-12 w-40" />
        <div className="shimmer rounded-[40px_16px_40px_16px] h-40" />
        <div className="shimmer rounded-[60px_20px_28px_100px] h-64" />
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="delivery-container space-y-6 !max-w-2xl">
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('driver-home')}
          className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-250 dark:border-white/5 text-slate-700 dark:text-zinc-355 flex items-center gap-2"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Volver
        </motion.button>
        <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[40px_16px_40px_16px] p-6 text-center py-10 backdrop-blur-xl">
          <MapPin className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1 font-serif">Sin datos</h3>
          <p className="text-xs text-muted-foreground mb-4 font-semibold">
            {orderError ? 'Error al cargar el pedido' : 'Pedido no encontrado'}
          </p>
          <Button onClick={() => refetchOrder()} className="rounded-full px-6 py-2 text-xs font-black uppercase tracking-widest bg-teal-500 hover:bg-teal-600 text-white">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStatusStepIndex(order.status);
  const totalAmount = order.items
    ? order.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    : 0;

  return (
    <div className={cn(
      "delivery-container space-y-6 !max-w-2xl font-sans relative overflow-visible",
      isElderlyMode && "text-base font-medium [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:text-sm [&_button]:h-12"
    )}>
      
      {/* Background Ambience Blobs */}
      <div className="absolute top-[20%] left-[-10%] size-80 bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-80 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <motion.button
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('driver-home')}
        className="rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 border border-slate-200/55 dark:border-white/5 text-slate-700 dark:text-zinc-350 flex items-center gap-2 w-fit shadow-sm backdrop-blur-sm cursor-pointer"
      >
        <ArrowLeft className="size-4 shrink-0" />
        Volver a entregas
      </motion.button>

      {/* Order Header Card */}
      <div style={{ borderRadius: '40px 16px 32px 16px' }} className="px-5 py-5 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black text-slate-805 dark:text-white font-serif">
              Pedido #{order.id?.slice(0, 8) || '...'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-450 font-bold mt-1">
              {formatDate(order.order_date, 'dd/MM/yyyy HH:mm')} hrs
            </p>
          </div>
          <StatusBadge status={order.status} type="delivery" />
        </div>
      </div>

      {/* Tactical Map Scope */}
      <div style={{ borderRadius: '60px 20px 28px 100px' }} className="p-3 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="rounded-[56px_16px_24px_96px] overflow-hidden h-72">
          <DriverMap order={order} height="100%" />
        </div>
      </div>

      {/* Pickup & Delivery Details briefing */}
      <div style={{ borderRadius: '32px 120px 20px 40px' }} className="px-5 py-6 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-xl space-y-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-455 pb-3 border-b border-dashed border-slate-250 dark:border-white/10">
          Detalles del Envío
        </h3>

        {/* Pickup */}
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest">Origen (Farmacia)</p>
            <p className="text-xs font-black text-slate-805 dark:text-white font-serif mt-1">
              {order.pharmacy?.name || 'Farmacia'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-450 font-semibold mt-0.5">{order.pickup_address || 'N/A'}</p>
          </div>
        </div>

        {/* Path connector line */}
        <div className="flex justify-start pl-5">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-5 bg-dashed border-l border-dashed border-slate-300 dark:border-white/10" />
            <MapPin className="size-3.5 text-slate-350 dark:text-zinc-700" />
            <div className="w-px h-5 bg-dashed border-l border-dashed border-slate-300 dark:border-white/10" />
          </div>
        </div>

        {/* Delivery Destination */}
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 shrink-0 shadow-sm">
            <MapPin className="size-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest">Destino de Entrega</p>
            <p className="text-xs font-black text-slate-805 dark:text-white font-serif mt-1">{order.delivery_address}</p>
            {order.patient && (
              <p className="text-[10px] text-slate-550 dark:text-zinc-450 font-bold mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-black/10 border border-slate-200 dark:border-white/5 text-[9px] font-black">{order.patient.name}</span>
                {order.patient.phone && ` · ${order.patient.phone}`}
              </p>
            )}
          </div>
        </div>

        {order.notes && (
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-[10px] font-bold text-slate-650 dark:text-zinc-350 leading-relaxed shadow-sm">
            <span className="font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider block mb-0.5">Nota de Entrega:</span>
            {order.notes}
          </div>
        )}
      </div>

      {/* Status Timeline Beads */}
      <div style={{ borderRadius: '28px 16px 40px 16px' }} className="px-5 py-6 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-450 pb-3 border-b border-dashed border-slate-250 dark:border-white/10 mb-5">
          Estado del Envío
        </h3>
        <div className="space-y-0 pl-1">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-4">
                {/* Timeline indicator bead */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full shrink-0 transition-all border shadow-sm',
                      isCompleted
                        ? 'bg-teal-500/10 border-teal-500/25 text-teal-605 dark:text-teal-400'
                        : 'bg-white/40 dark:bg-zinc-900 border-slate-200 dark:border-white/5 text-slate-400 dark:text-zinc-550',
                      isCurrent && 'ring-4 ring-teal-550/15 scale-110 shadow-md',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 h-8 my-0.5',
                        index < currentStepIndex 
                          ? 'bg-gradient-to-b from-teal-500 to-teal-500/50' 
                          : 'bg-slate-200 dark:bg-zinc-800',
                      )}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className="pb-8 pt-1">
                  <p
                    className={cn(
                      'text-xs font-black uppercase tracking-wider',
                      isCompleted ? 'text-slate-805 dark:text-white' : 'text-slate-450 dark:text-zinc-555',
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && order.status !== 'delivered' && (
                    <p className="text-[10px] text-teal-655 dark:text-teal-400 font-bold mt-0.5 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-teal-500 animate-ping" />
                      Estado actual
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Package Manifest Items */}
      <div style={{ borderRadius: '80px 40px 32px 120px' }} className="px-5 py-6 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-455 pb-3 border-b border-dashed border-slate-250 dark:border-white/10 mb-4">
          Artículos en Paquete
        </h3>
        {order.items && order.items.length > 0 ? (
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  borderRadius: idx % 2 === 0 
                    ? '24px 12px 16px 12px' 
                    : '12px 24px 12px 16px'
                }}
                className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-white/5 shadow-inner"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
                    <Package className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-805 dark:text-white font-serif">{item.medicine?.name || 'Medicamento'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-450 font-bold mt-0.5">x{item.quantity} unidades</p>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-white font-mono">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 pt-3 border-t border-slate-200 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Monto Total</span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-serif">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs font-bold text-slate-450 dark:text-zinc-550 text-center py-6">Sin artículos en este manifiesto</p>
        )}
      </div>

      {/* Action Buttons (Curvilinear Liquid Capsules) */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="flex flex-col gap-3.5 w-full pt-2">
          {order.status === 'assigned' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-650 hover:to-teal-650 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-teal-500/15 h-13 gap-2 flex items-center justify-center border-none disabled:opacity-50 cursor-pointer transition-all duration-300"
              onClick={() => handleStatusUpdate('picked_up')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <PackageOpen className="size-5 shrink-0" />}
              {isUpdating ? 'ACTUALIZANDO...' : 'Recoger pedido de farmacia'}
            </motion.button>
          )}
          {order.status === 'picked_up' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-650 hover:to-sky-650 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-sky-500/15 h-13 gap-2 flex items-center justify-center border-none disabled:opacity-50 cursor-pointer transition-all duration-300"
              onClick={() => handleStatusUpdate('in_transit')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <Navigation className="size-5 shrink-0" />}
              {isUpdating ? 'ACTUALIZANDO...' : 'Iniciar ruta de entrega'}
            </motion.button>
          )}
          {order.status === 'in_transit' && (
            <div className="flex flex-col gap-3 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/40 hover:bg-teal-500/10 text-teal-605 dark:text-teal-400 font-black text-xs uppercase tracking-widest rounded-full border border-teal-500/20 h-12.5 gap-2 flex items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer"
                onClick={() => setConfirmDeliveryOpen(true)}
                disabled={isUpdating}
              >
                <QrCode className="size-5 animate-pulse" />
                Escanear QR digital paciente
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-650 hover:to-emerald-650 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/15 h-13 gap-2 flex items-center justify-center border-none disabled:opacity-50 cursor-pointer transition-all duration-300"
                onClick={() => setConfirmDeliveryOpen(true)}
                disabled={isUpdating}
              >
                <CheckCircle2 className="size-5 shrink-0" />
                Confirmar Entrega
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Delivery Confirmation Modal Drawer */}
      <AnimatePresence>
        {confirmDeliveryOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-[40px_16px_40px_16px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Glowing Ambient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <div className="size-16 bg-teal-500/15 rounded-2xl flex items-center justify-center text-teal-400 mx-auto mb-4 border border-teal-500/20 shadow-md">
                  <QrCode className="size-10" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider font-serif">Confirmar Entrega</h3>
                <p className="text-xs text-gray-400 mt-2 font-semibold leading-relaxed">
                  Escanea el ID Digital del paciente <span className="font-black text-teal-400">{order.patient?.name}</span> para verificar de forma segura.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">¿Quién recibe el paquete?</label>
                  <input
                    placeholder="Ej. El propio paciente, madre, tutor"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 font-bold placeholder:text-gray-550"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Código QR o ID Digital de Paciente</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="patient-id-xxxx"
                      value={patientQrCode}
                      onChange={(e) => {
                        setPatientQrCode(e.target.value);
                        if (verificationError) setVerificationError('');
                      }}
                      className="flex-1 h-11 px-4 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500 placeholder:text-gray-550"
                    />
                    <Button
                      size="sm"
                      className="bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-[9px] font-black uppercase tracking-widest rounded-xl px-3 border border-teal-500/10"
                      onClick={() => {
                        setPatientQrCode(`patient-id-${order.patient?.id}`);
                        setReceiverName(order.patient?.name || '');
                        setVerificationError('');
                      }}
                    >
                      Completar
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
                  className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white" 
                  onClick={() => {
                    setConfirmDeliveryOpen(false);
                    setVerificationError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 font-black text-[10px] uppercase tracking-widest rounded-xl"
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
