'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useDeliveryOrder,
  useDeliveryRoute,
  useUpdateDeliveryStatus,
  useUpdateDeliveryLocation,
} from '@/hooks/use-api';
import { formatDate, formatCurrency, formatDistance } from '@/utils/helpers';
import { DELIVERY_STATUS_CONFIG, DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { StatusBadge } from '@/components/common/status-badge';
import { MapView } from '@/components/common/map-view';
import { DriverMap } from './DriverMap';
import type { MapMarker } from '@/components/common/map-view';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
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

function SwipeButton({
  onConfirm,
  text,
  colorClasses = "from-teal-500 to-cyan-500",
  icon: Icon = Truck,
  disabled = false,
}: {
  onConfirm: () => void;
  text: string;
  colorClasses?: string;
  icon?: any;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragRange, setDragRange] = useState(150);
  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      setDragRange(width - 56); // handle size (48px) + padding (8px)
    }
  }, []);

  const handleDragEnd = () => {
    if (x.get() >= dragRange * 0.85) {
      onConfirm();
    }
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
  };

  const bgWidth = useTransform(x, [0, dragRange], [48, dragRange + 48]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-14 bg-slate-500/5 dark:bg-white/[0.03] rounded-full p-1 border border-slate-200/40 dark:border-white/5 overflow-hidden flex items-center select-none shadow-inner",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      {/* Visual liquid glowing bar tracking the drag handle */}
      <motion.div 
        className="absolute left-1 top-1 bottom-1 bg-gradient-to-r from-teal-500/20 to-teal-500/5 dark:from-teal-500/30 dark:to-teal-500/10 rounded-full pointer-events-none"
        style={{ width: bgWidth }}
      />
      
      {/* Sliding text label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 animate-pulse">
          {text} →
        </span>
      </div>

      {/* Tactile drag capsule */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: dragRange }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "size-12 rounded-full bg-gradient-to-r flex items-center justify-center text-white shadow-lg cursor-grab active:cursor-grabbing z-10 transition-transform duration-200",
          colorClasses
        )}
      >
        <Icon className="size-5 shrink-0" />
      </motion.div>
    </div>
  );
}

export function DeliveryDetail() {
  const { selectedItemId, setNotification, navigate, isElderlyMode } = useAuthStore();

  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [patientQrCode, setPatientQrCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

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

  useEffect(() => {
    if (!order || order.status !== 'in_transit') return;

    let watchId: number | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const handleCoordsUpdate = (coords: GeolocationCoordinates) => {
      updateLocation.mutate({
        orderId: order.id,
        lat: coords.latitude,
        lng: coords.longitude,
      });
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          handleCoordsUpdate(position.coords);
        },
        (error) => {
          console.warn('watchPosition failed:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

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
      <div className="space-y-6 max-w-2xl mx-auto px-1 sm:px-0">
        <div className="shimmer rounded-full h-10 w-28 opacity-70" />
        <div className="shimmer rounded-[40px_16px_40px_16px] h-64 w-full opacity-70" />
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto px-1 sm:px-0 text-center py-12">
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('driver-home')}
          className="rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 border border-slate-200/50 text-slate-700 dark:text-zinc-350 flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="size-4" /> Volver
        </motion.button>
        <p className="text-xs font-bold text-slate-450 mt-4">Error al cargar la bitácora del pedido.</p>
      </div>
    );
  }

  const currentStepIndex = getStatusStepIndex(order.status);
  const totalAmount = order.items
    ? order.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    : 0;

  return (
    <div className={cn(
      "space-y-6 pb-24 font-sans relative overflow-visible px-1 sm:px-0 max-w-2xl mx-auto",
      isElderlyMode && "text-base font-medium [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:text-sm [&_button]:h-12"
    )}>
      
      {/* Ambience background */}
      <div className="absolute top-[20%] left-[-10%] size-80 bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Top Action */}
      <div className="flex items-center justify-between pb-2">
        <motion.button
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('driver-home')}
          className="rounded-full px-4 py-2 text-[8.5px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-zinc-350 flex items-center gap-2 shadow-sm backdrop-blur-sm cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Volver
        </motion.button>

        <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[8.5px] font-black uppercase tracking-widest">
          Bitácora Reparto
        </span>
      </div>

      {/* 1. Curved Top Header Panel — Cardless */}
      <div className="bg-teal-500/10 dark:bg-zinc-950/40 border-b border-dashed border-teal-500/20 rounded-b-[40px] py-6 px-5 -mx-4 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/[0.03] rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start gap-4 relative z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white font-serif">
              Orden #{order.id?.slice(0, 8) || '...'}
            </h2>
            <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold mt-1">
              Despachada: {formatDate(order.order_date, 'dd/MM/yyyy HH:mm')} hrs
            </p>
          </div>
          <StatusBadge status={order.status} type="delivery" />
        </div>
      </div>

      {/* 2. Tactical Navigation Map Preview — Floating Scope */}
      <div className="relative rounded-[32px_12px_24px_12px] overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-md h-64 bg-zinc-950">
        <DriverMap order={order} height="100%" />
      </div>

      {/* 3. Integrated Cargo Manifest & Route timeline sheet — All Cardless */}
      <div className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 rounded-[40px_16px_40px_16px] backdrop-blur-md p-5 shadow-xl space-y-6">
        
        {/* Route Steps */}
        <div className="space-y-4">
          <p className="text-[8px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-[0.2em] pb-2 border-b border-dashed border-slate-200 dark:border-white/5">RUTA TÁCTICA DE ENTREGA</p>
          
          <div className="flex items-start gap-3.5 relative">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 shrink-0">
              <Building2 className="size-4.5" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">ORIGEN RECOLECCIÓN</p>
              <h4 className="text-xs font-black text-slate-800 dark:text-white font-serif mt-0.5">{order.pharmacy?.name || 'Farmacia'}</h4>
              <p className="text-[10px] text-slate-550 dark:text-zinc-400 font-bold mt-0.5">{order.pickup_address || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 relative">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 shrink-0">
              <MapPin className="size-4.5" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">DESTINO ENTREGA</p>
              <h4 className="text-xs font-black text-slate-800 dark:text-white font-serif mt-0.5">{order.delivery_address}</h4>
              {order.patient && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-500/5 dark:bg-black/10 border border-slate-250 dark:border-white/5 text-[8.5px] font-black text-slate-700 dark:text-zinc-350">{order.patient.name}</span>
                  {order.patient.phone && <span className="text-[9.5px] font-mono text-slate-450">{order.patient.phone}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cargo manifest */}
        <div className="space-y-3 pt-2">
          <p className="text-[8px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-[0.2em] pb-2 border-b border-dashed border-slate-200 dark:border-white/5">MANIFESTO DE ARTÍCULOS</p>
          
          {order.items && order.items.length > 0 ? (
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs font-bold py-1">
                  <div className="flex items-center gap-2 text-slate-705 dark:text-zinc-300">
                    <span className="size-1.5 rounded-full bg-teal-500/60" />
                    <span>{item.medicine?.name || 'Medicamento'}</span>
                    <span className="text-slate-400 font-mono text-[10px]">x{item.quantity}</span>
                  </div>
                  <span className="font-mono text-slate-800 dark:text-white">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-white/5">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Valor total cargamento</span>
                <span className="text-sm font-black text-slate-905 dark:text-white font-serif">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center">Sin manifiesto especificado.</p>
          )}
        </div>

        {/* Status Steps Tracker */}
        <div className="space-y-4 pt-2">
          <p className="text-[8px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-[0.2em] pb-2 border-b border-dashed border-slate-200 dark:border-white/5">HISTORIAL DE ESTADO</p>
          
          <div className="relative pl-2 space-y-4">
            <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-zinc-800" />
            
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-3 relative z-10">
                  <div className={cn(
                    "size-7 rounded-full flex items-center justify-center border transition-all duration-300",
                    isCompleted
                      ? "bg-teal-500/10 border-teal-500/25 text-teal-600 dark:text-teal-400 shadow-sm"
                      : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-white/5 text-slate-400 dark:text-zinc-600"
                  )}>
                    <Icon className="size-3.5 shrink-0" />
                  </div>
                  <div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      isCompleted ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-zinc-600"
                    )}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-bold text-slate-650 dark:text-zinc-350 leading-relaxed shadow-sm">
            <span className="font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider block mb-0.5">Comentarios de Recolección:</span>
            {order.notes}
          </div>
        )}
      </div>

      {/* Action Buttons — Tactile driving-ergonomic Swipe Sliders */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="w-full pt-2">
          {order.status === 'assigned' && (
            <SwipeButton
              onConfirm={() => handleStatusUpdate('picked_up')}
              text={isUpdating ? 'ACTUALIZANDO...' : 'Desliza para recoger de farmacia'}
              colorClasses="from-teal-500 to-emerald-600"
              icon={PackageOpen}
              disabled={isUpdating}
            />
          )}
          {order.status === 'picked_up' && (
            <SwipeButton
              onConfirm={() => handleStatusUpdate('in_transit')}
              text={isUpdating ? 'ACTUALIZANDO...' : 'Desliza para iniciar ruta'}
              colorClasses="from-sky-500 to-indigo-650"
              icon={Navigation}
              disabled={isUpdating}
            />
          )}
          {order.status === 'in_transit' && (
            <SwipeButton
              onConfirm={() => setConfirmDeliveryOpen(true)}
              text="Desliza para verificar paciente"
              colorClasses="from-emerald-500 to-teal-600 animate-pulse"
              icon={QrCode}
              disabled={isUpdating}
            />
          )}
        </div>
      )}

      {/* Confirmation Modal Drawer */}
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <div className="size-14 bg-teal-500/15 rounded-2xl flex items-center justify-center text-teal-400 mx-auto mb-4 border border-teal-500/20 shadow-md">
                  <QrCode className="size-8" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider font-serif">Confirmar Entrega</h3>
                <p className="text-[11px] text-gray-400 mt-2 font-semibold leading-relaxed">
                  Escanea el ID Digital de <span className="font-black text-teal-400">{order.patient?.name}</span> para verificar.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">¿Quién recibe?</label>
                  <input
                    placeholder="Ej. Paciente, Madre, Tutor"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 font-bold placeholder:text-gray-550"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Código QR o ID Digital</label>
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
