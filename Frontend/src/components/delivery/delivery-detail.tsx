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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          if (newStatus === 'delivered') {
            navigate('driver-home');
          }
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
          navigate('driver-home');
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
      "relative w-full h-[calc(100vh-100px)] md:h-[calc(100vh-64px)] overflow-hidden font-sans select-none",
      isElderlyMode && "text-base font-medium [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:text-sm [&_button]:h-12"
    )}>
      
      {/* 1. Immersive Full-Screen Map Canvas */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <DriverMap order={order} height="100%" />
      </div>

      {/* 2. Floating Navigation HUD Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('driver-home')}
          className="pointer-events-auto rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-widest bg-white/90 dark:bg-zinc-950/90 border border-slate-200/50 dark:border-white/10 text-slate-800 dark:text-zinc-200 flex items-center gap-2 shadow-xl backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Radar
        </motion.button>

        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/50 dark:border-white/10 bg-white/90 dark:bg-zinc-950/90 px-4 py-2 shadow-xl backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-teal-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Misión en Curso</span>
        </div>
      </div>

      {/* 3. Glassmorphic Pull-up Bottom Sheet (Drawer) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 w-full max-w-xl mx-auto pointer-events-none p-4">
        <motion.div
          initial={{ y: 250, opacity: 0 }}
          animate={{ y: isCollapsed ? "calc(100% - 76px)" : 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "pointer-events-auto bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-slate-200/40 dark:border-white/5 rounded-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.18)] p-6 select-none transition-all duration-300",
            isCollapsed ? "max-h-[76px] overflow-hidden cursor-pointer" : "max-h-[50vh] overflow-y-auto space-y-6"
          )}
          onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
        >
          {/* Pull indicator pill & Toggle */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="w-full flex flex-col items-center justify-center -mt-2 mb-4 cursor-pointer py-1 select-none"
          >
            <div className="w-12 h-1 bg-slate-350 dark:bg-zinc-800 rounded-full" />
            <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-1">
              {isCollapsed ? "Ver Detalles (Expandir)" : "Ocultar Detalles (Colapsar)"}
            </span>
          </div>

          {/* Header Info */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">ORDEN EN SEGUIMIENTO</span>
              <h2 className="text-sm font-black text-slate-905 dark:text-white font-serif mt-0.5">
                Orden #{order.id?.slice(0, 8) || '...'}
              </h2>
            </div>
            <StatusBadge status={order.status} type="delivery" />
          </div>

          {/* Status Steps Tracker Dot Timeline */}
          <div className="flex items-center justify-between px-2 py-2.5 border-y border-dashed border-slate-200 dark:border-white/5">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 relative">
                  <div className={cn(
                    "size-6.5 rounded-full flex items-center justify-center border transition-all duration-300 text-[9px] font-black",
                    isCurrent && "bg-teal-500 text-white ring-4 ring-teal-500/25",
                    isCompleted && !isCurrent && "bg-teal-500/10 border-teal-500/25 text-teal-600 dark:text-teal-400",
                    !isCompleted && "bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/5 text-slate-400 dark:text-zinc-605"
                  )}>
                    {index + 1}
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-wider scale-90",
                    isCurrent ? "text-teal-500" : isCompleted ? "text-slate-800 dark:text-zinc-300" : "text-slate-400 dark:text-zinc-650"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Route Steps / Addresses */}
          <div className="space-y-4 pt-1">
            {/* Pharmacy Origin */}
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Building2 className="size-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[7.5px] font-black text-emerald-655 dark:text-emerald-450 uppercase tracking-widest">Punto de Retiro</span>
                <h4 className="text-xs font-bold text-slate-805 dark:text-zinc-200 mt-0.5 truncate font-serif">{order.pharmacy?.name || 'Farmacia'}</h4>
                <p className="text-[10px] text-slate-550 dark:text-zinc-400 mt-0.5 truncate font-medium">{order.pickup_address || 'N/A'}</p>
              </div>
            </div>

            {/* Patient Destination */}
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                <MapPin className="size-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[7.5px] font-black text-rose-655 dark:text-rose-450 uppercase tracking-widest">Destino de Entrega</span>
                <h4 className="text-xs font-bold text-slate-805 dark:text-zinc-200 mt-0.5 truncate font-serif">{order.delivery_address}</h4>
                {order.patient && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-500/5 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 text-[8.5px] font-black text-slate-700 dark:text-zinc-350">{order.patient.name}</span>
                    {order.patient.phone && <span className="text-[9.5px] font-mono text-slate-450 dark:text-zinc-450">{order.patient.phone}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Note */}
          {order.notes && (
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-bold text-slate-600 dark:text-zinc-350 leading-relaxed shadow-sm">
              <span className="font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider block mb-0.5">Comentarios de Recolección:</span>
              {order.notes}
            </div>
          )}

          {/* Cargo manifest */}
          {order.items && order.items.length > 0 && (
            <div className="bg-slate-500/[0.02] dark:bg-black/10 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 space-y-2">
              <span className="text-[7.5px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest block mb-1">Manifiesto de Receta</span>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-zinc-300 truncate max-w-[70%]">{item.medicine?.name || 'Medicamento'} <span className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">x{item.quantity}</span></span>
                  <span className="font-mono text-slate-800 dark:text-zinc-200">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-white/5 mt-2">
                <span className="text-[8px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest">Subtotal Cargamento</span>
                <span className="text-xs font-black text-slate-905 dark:text-white font-mono">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Dynamic Action Trigger Slider */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="pt-2">
              {order.status === 'assigned' && (
                <SwipeButton
                  text={isUpdating ? 'PROCESANDO...' : 'Deslizar para confirmar Retiro'}
                  onConfirm={() => handleStatusUpdate('picked_up')}
                  colorClasses="from-teal-500 to-cyan-500"
                  icon={PackageOpen}
                  disabled={isUpdating}
                />
              )}
              {order.status === 'picked_up' && (
                <SwipeButton
                  text={isUpdating ? 'PROCESANDO...' : 'Deslizar para iniciar Ruta'}
                  onConfirm={() => handleStatusUpdate('in_transit')}
                  colorClasses="from-sky-500 to-blue-600"
                  icon={Navigation}
                  disabled={isUpdating}
                />
              )}
              {order.status === 'in_transit' && (
                <SwipeButton
                  text="Deslizar para entregar"
                  onConfirm={() => setConfirmDeliveryOpen(true)}
                  colorClasses="from-emerald-500 to-teal-600 font-bold animate-[pulse_3s_infinite]"
                  icon={CheckCircle2}
                  disabled={isUpdating}
                />
              )}
            </div>
          )}

        </motion.div>
      </div>

      {/* Confirmation Modal Drawer */}
      <AnimatePresence>
        {confirmDeliveryOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-850 dark:text-white rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <div className="size-14 bg-teal-500/15 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-4 border border-teal-500/20 shadow-md">
                  <QrCode className="size-8" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider font-serif">Confirmar Entrega</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-semibold leading-relaxed">
                  Escanea el ID Digital de <span className="font-black text-teal-500">{order.patient?.name}</span> para verificar.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">¿Quién recibe?</label>
                  <input
                    placeholder="Ej. Paciente, Madre, Tutor"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-800 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 font-bold placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Código QR o ID Digital</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="patient-id-xxxx"
                      value={patientQrCode}
                      onChange={(e) => {
                        setPatientQrCode(e.target.value);
                        if (verificationError) setVerificationError('');
                      }}
                      className="flex-1 h-11 px-4 bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-800 text-slate-805 dark:text-white rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
                    />
                    <Button
                      size="sm"
                      className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-[9px] font-black uppercase tracking-widest rounded-xl px-3 border border-teal-500/10 cursor-pointer"
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
                    <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-1">{verificationError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white cursor-pointer" 
                  onClick={() => {
                    setConfirmDeliveryOpen(false);
                    setVerificationError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-teal-650 hover:bg-teal-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer"
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
