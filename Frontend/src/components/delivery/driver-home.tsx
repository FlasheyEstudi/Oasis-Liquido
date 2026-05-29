'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { MapView } from '@/components/common/map-view';
import {
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
  Maximize2,
  Minimize2,
  Radio,
  Target,
  Compass,
  Wifi,
  Volume2,
  VolumeX,
  TrendingUp,
  Map,
  Shield,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import type { DeliveryStatus } from '@/types';

// Web Audio API Synthesizer for high-end tactical sound design
const playRadarSound = (type: 'ping' | 'success' | 'click' | 'sonar') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'ping') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'sonar') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } else if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.45);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {
    console.warn('Audio synthesis blocked by browser security policy:', e);
  }
};

const stagger: any = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp: any = {
  initial: { opacity: 0, scale: 0.96, y: 24 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 22 } },
};

export function DriverHome() {
  const { user, setNotification, navigate, isElderlyMode } = useAuthStore();
  const queryClient = useQueryClient();

  // Core state declarations
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localAvailable, setLocalAvailable] = useState(true);
  const [isFullscreenRadar, setIsFullscreenRadar] = useState(false);
  const [selectedRadarOrder, setSelectedRadarOrder] = useState<any | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'high_fee'>('all');

  const driverId = user?.id || '';
  const firstName = user?.name?.split(' ')[0] || 'Repartidor';

  // API query hooks
  const { data: stats } = useDriverEarnings(localAvailable);
  const { data: availableOrders = [], isLoading: availableLoading } = useAvailableDeliveries(localAvailable);
  const { data: activeOrders = [], isLoading: activeLoading } = useAssignedDeliveries(!!driverId);

  // API mutation hooks
  const { mutateAsync: acceptOrder } = useAcceptDelivery();
  const { mutateAsync: rejectOrder } = useRejectDelivery();
  const updateDeliveryStatus = useUpdateDeliveryStatus();

  const isLoading = activeLoading || availableLoading;

  // Geolocation tracking effect
  useEffect(() => {
    if (!localAvailable) {
      setDriverCoords(null);
      return;
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Radar driver geolocation error:', err.message);
          setDriverCoords({ lat: 12.1364, lng: -86.2514 }); // Central Managua
        },
        { enableHighAccuracy: true }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('Radar geolocation watch error:', err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [localAvailable]);

  // Radar ping audio triggers
  useEffect(() => {
    if (localAvailable && availableOrders.length > 0 && soundEnabled) {
      playRadarSound('ping');
    }
  }, [availableOrders.length, localAvailable, soundEnabled]);

  // Build markers
  const radarMarkers = useMemo(() => {
    const list: any[] = [];

    if (driverCoords) {
      list.push({
        id: 'driver',
        lat: driverCoords.lat,
        lng: driverCoords.lng,
        type: 'driver',
        label: 'Tu Ubicación Táctica',
      });
    }

    availableOrders.forEach((order: any) => {
      const pLat = order.pickup_lat ?? order.pickupLat;
      const pLng = order.pickup_lng ?? order.pickupLng;
      const dLat = order.delivery_lat ?? order.deliveryLat;
      const dLng = order.delivery_lng ?? order.deliveryLng;

      if (pLat && pLng) {
        list.push({
          id: `pickup-${order.id}`,
          lat: pLat,
          lng: pLng,
          type: 'pharmacy',
          label: `Origen: ${order.pharmacy?.name || 'Farmacia'} (+${formatCurrency(order.deliveryFee || 60)})`,
          orderRef: order,
        });
      }

      if (dLat && dLng) {
        list.push({
          id: `delivery-${order.id}`,
          lat: dLat,
          lng: dLng,
          type: 'destination',
          label: `Destino: Entregar Pedido #${order.id.slice(-6)}`,
          orderRef: order,
        });
      }
    });

    return list;
  }, [driverCoords, availableOrders]);

  const radarMapCenter = useMemo((): [number, number] => {
    if (driverCoords) return [driverCoords.lat, driverCoords.lng];
    return [12.1364, -86.2514];
  }, [driverCoords]);

  const handleMarkerClick = (marker: any) => {
    if (soundEnabled) playRadarSound('click');
    if (marker.orderRef) {
      setSelectedRadarOrder(marker.orderRef);
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: 'picked_up' | 'in_transit' | 'delivered') => {
    if (soundEnabled) playRadarSound('sonar');
    setUpdatingId(orderId);
    updateDeliveryStatus.mutate(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          const statusLabels: Record<string, string> = {
            picked_up: 'Pedido recogido de farmacia',
            in_transit: 'Ruta iniciada con éxito',
            delivered: 'Pedido entregado al paciente',
          };
          if (soundEnabled) playRadarSound('success');
          setNotification({ type: 'success', message: statusLabels[newStatus] || 'Estado actualizado' });
        },
        onError: (err) => {
          setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al actualizar el estado' });
        },
        onSettled: () => {
          setUpdatingId(null);
        },
      }
    );
  };

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (soundEnabled) playRadarSound('success');
    try {
      const orderToAccept = availableOrders.find((o: any) => o.id === id);
      if (orderToAccept) {
        queryClient.setQueryData(['deliveries', 'assigned'], (old: any[] = []) => [
          ...old,
          { ...orderToAccept, status: 'accepted', deliveryDriverId: driverId },
        ]);
      }
      
      navigate('delivery-detail', id);
      await acceptOrder(id);
      setNotification({ type: 'success', message: '¡Misión aceptada con éxito!' });
    } catch {
      setNotification({ type: 'error', message: 'Error al aceptar el pedido' });
      navigate('inicio-repartidor');
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (soundEnabled) playRadarSound('click');
    try {
      await rejectOrder(id);
      setNotification({ type: 'info', message: 'Pedido declinado en tu radar' });
    } catch {
      setNotification({ type: 'error', message: 'Error al rechazar el pedido' });
    }
  };

  const getActionForOrder = (orderStatus: string) => {
    switch (orderStatus) {
      case 'accepted':
      case 'assigned':
        return {
          label: 'Recoger en farmacia',
          icon: PackageOpen,
          newStatus: 'picked_up' as const,
          className: 'bg-teal-500 hover:bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/20 h-11 rounded-full transition-all duration-300 border-none w-full flex items-center justify-center gap-2 cursor-pointer',
        };
      case 'picked_up':
        return {
          label: 'Iniciar ruta al paciente',
          icon: Navigation,
          newStatus: 'in_transit' as const,
          className: 'bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-sky-500/20 h-11 rounded-full transition-all duration-300 border-none w-full flex items-center justify-center gap-2 cursor-pointer',
        };
      case 'in_transit':
        return {
          label: 'Marcar como entregado',
          icon: CheckCircle2,
          newStatus: 'delivered' as const,
          className: 'bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 h-11 rounded-full transition-all duration-300 border-none w-full flex items-center justify-center gap-2 cursor-pointer',
        };
      default:
        return null;
    }
  };

  const filteredAvailableOrders = useMemo(() => {
    if (activeTab === 'high_fee') {
      return availableOrders.filter((o: any) => (o.deliveryFee || 60) >= 100);
    }
    return availableOrders;
  }, [availableOrders, activeTab]);

  if (isLoading) {
    return (
      <div className="delivery-container space-y-6">
        <div className="shimmer rounded-[40px_16px_40px_16px] h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="shimmer rounded-[24px_12px_20px_12px] h-36" />
          <div className="shimmer rounded-[12px_24px_12px_20px] h-36" />
          <div className="shimmer rounded-[20px_12px_24px_12px] h-36" />
        </div>
        <div className="shimmer rounded-[80px_40px_32px_120px] h-[400px] w-full animate-shimmer-fast" />
      </div>
    );
  }

  return (
    <motion.div 
      className={cn(
        "delivery-container space-y-6 font-sans relative overflow-visible",
        isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_button]:text-sm [&_button]:h-12"
      )} 
      variants={stagger} 
      initial="initial" 
      animate="animate"
    >
      
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-[30%] left-[-15%] size-96 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-15%] size-96 rounded-full bg-gradient-to-br from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* 1. Header Card - Welcome & Telemetry Visor Shield */}
      <motion.div 
        className="relative overflow-hidden rounded-[80px_40px_32px_120px] px-4 py-6 sm:p-8 bg-white/20 dark:bg-zinc-950/20 text-slate-805 dark:text-white shadow-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-xl" 
        variants={fadeUp}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="size-14 sm:size-16 rounded-[24px_10px_20px_10px] bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-650 dark:text-teal-400 shrink-0 shadow-lg shadow-teal-500/5">
              <Bike className="size-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-serif">
                  Hola, {firstName}
                </h2>
                <Sparkles className="size-4.5 text-yellow-500 dark:text-yellow-400 fill-yellow-400/20 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-bold">
                {activeOrders.length > 0
                  ? `Tienes ${activeOrders.length} misión/misiones activas en curso. ¡Conduce con cuidado!`
                  : 'Radar activo. Conéctate y abre el visor satelital táctico en pantalla completa.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Live Indicator block */}
            <div className="flex items-center gap-2 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-full px-4 py-2 text-[8px] font-black uppercase tracking-widest text-emerald-650 dark:text-emerald-400 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Central Oasis En Línea</span>
            </div>
            
            {/* Audio Toggle Feedback */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playRadarSound('click');
              }}
              className={cn(
                'size-10 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-md backdrop-blur-sm',
                soundEnabled
                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-650 dark:text-teal-400 hover:bg-teal-500/20'
                  : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-400 dark:text-zinc-500 hover:bg-white/10'
              )}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        
        {/* Availability Switch Shield */}
        <div style={{ borderRadius: '40px 16px 28px 16px' }} className="px-5 py-5 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-xl flex flex-col justify-between" variants={fadeUp}>
          <div className="flex items-center gap-3.5">
            <div className={cn(
              'size-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-200/20',
              localAvailable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
            )}>
              <CircleDot className={cn('size-6', localAvailable && 'animate-pulse')} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Tu Estado</p>
              <p className="text-base font-black text-slate-800 dark:text-white mt-0.5 font-serif">
                {localAvailable ? 'Disponible' : 'Offline'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setLocalAvailable(!localAvailable);
              if (soundEnabled) playRadarSound('success');
            }}
            className={cn(
              'w-full mt-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border shadow-sm text-center flex items-center justify-center shrink-0',
              localAvailable
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-emerald-500 text-white border-transparent hover:bg-emerald-600'
            )}
          >
            {localAvailable ? 'Desconectar' : 'Conectarse'}
          </motion.button>
        </div>

        {/* Daily Earnings Card */}
        <div style={{ borderRadius: '16px 40px 16px 28px' }} className="px-5 py-5 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-xl flex flex-col justify-between group" variants={fadeUp}>
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center shadow-sm border border-slate-200/20">
              <DollarSign className="size-6 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Créditos del Día</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-xl font-black text-slate-880 dark:text-white font-serif">
                  {formatCurrency(stats?.totalEarnings ?? 0)}
                </p>
                <span className="text-[9px] text-emerald-655 dark:text-emerald-500 font-black flex items-center gap-0.5">
                  <TrendingUp className="size-3" /> +100%
                </span>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-450 dark:text-zinc-500 font-bold mt-4 border-t border-dashed border-slate-250 dark:border-white/5 pt-2 flex items-center justify-between">
            <span>Entregas Completadas</span>
            <span className="font-mono font-black text-slate-800 dark:text-white">{stats?.totalDeliveries ?? 0} MISIONES</span>
          </p>
        </div>

        {/* Reputation Score Card */}
        <div style={{ borderRadius: '28px 16px 40px 16px' }} className="px-5 py-5 bg-white/20 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shadow-xl flex flex-col justify-between group" variants={fadeUp}>
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-teal-500/10 text-teal-655 dark:text-teal-400 flex items-center justify-center shadow-sm border border-slate-200/20">
              <Star className="size-6 fill-teal-500/20 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Reputación Escuadrón</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xl font-black text-slate-880 dark:text-white font-serif">
                  {stats?.rating ?? 5.0}
                </p>
                <div className="flex text-amber-500">
                  <Star className="size-3 fill-current" />
                  <Star className="size-3 fill-current" />
                  <Star className="size-3 fill-current" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-450 dark:text-zinc-500 font-bold mt-4 border-t border-dashed border-slate-250 dark:border-white/5 pt-2 flex items-center justify-between">
            <span>Rango de Reparto</span>
            <span className="font-black text-teal-650 dark:text-teal-400 uppercase tracking-widest">ELITE COURIER</span>
          </p>
        </div>
      </div>

      {/* 3. The Radar Portal Card (Mini Map Scope Visor) */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <div className="relative overflow-hidden rounded-[80px_40px_32px_120px] border border-slate-200 dark:border-zinc-800/80 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl shadow-2xl p-5 sm:p-6 transition-all duration-300">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 shadow-inner">
                <Radio className="size-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-850 dark:text-white flex items-center gap-2 font-serif">
                  Radar Táctico Oasis
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-teal-500/10 text-teal-500 border border-teal-500/20">
                    <span className="size-1.5 rounded-full bg-teal-450 animate-ping" />
                    Escaneo Managua
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-450 font-bold mt-1">
                  Visualiza farmacias y pacientes en tiempo real. Abre el visor en pantalla completa para capturar entregas.
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (soundEnabled) playRadarSound('success');
                setIsFullscreenRadar(true);
              }}
              className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-6 h-11 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent shadow-lg shadow-teal-500/5 transition-all duration-300 cursor-pointer self-start md:self-center"
            >
              <Maximize2 className="size-4 shrink-0" /> Buscar en Radar Completo
            </motion.button>
          </div>

          {/* Mini-Scope preview map */}
          <div className="relative rounded-[60px_20px_28px_100px] overflow-hidden border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl h-80 bg-zinc-950">
            {localAvailable ? (
              <MapView
                markers={radarMarkers}
                center={radarMapCenter}
                height="100%"
                onMarkerClick={handleMarkerClick}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-zinc-950/70 backdrop-blur-sm z-[500] text-center p-6">
                <Bike className="size-16 text-slate-400 dark:text-zinc-650 mb-3 animate-bounce" />
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-zinc-450">Sistema de Radar Inactivo</h4>
                <p className="text-xs text-slate-450 dark:text-zinc-500 font-bold max-w-xs mt-1 leading-relaxed">Conéctate en la parte superior para activar el posicionamiento satelital y recibir notificaciones.</p>
              </div>
            )}

            {/* Sweep radar lines overlay in mini-map */}
            {localAvailable && availableOrders.length === 0 && (
              <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center overflow-hidden">
                <div className="radar-sweep-line" />
                <div className="radar-circle w-32 h-32" />
                <div className="radar-circle w-64 h-64 animate-ping-slow" />
                <div className="radar-circle w-96 h-96" />
                
                <div className="absolute bottom-6 left-6 z-[401] rounded-2xl bg-zinc-950/90 border border-teal-500/20 px-4 py-2.5 text-[9px] font-black text-teal-400 uppercase tracking-widest backdrop-blur-md flex items-center gap-2">
                  <span className="size-2 rounded-full bg-teal-400 animate-ping" />
                  Buscando prescripciones en tu zona...
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4. Split Dashboard Grid: Available vs Assigned */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Freelance order board */}
        <div style={{ borderRadius: '40px 16px 32px 16px' }} className="p-5 border border-slate-200/50 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dashed border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-xs font-black text-slate-805 dark:text-white uppercase tracking-widest font-serif">Pedidos Disponibles</h3>
            </div>

            {/* Internal filters tabs */}
            <div className="flex bg-white/30 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/5">
              <button
                onClick={() => {
                  setActiveTab('all');
                  if (soundEnabled) playRadarSound('click');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 border-none',
                  activeTab === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-white bg-transparent'
                )}
              >
                Todos ({availableOrders.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('high_fee');
                  if (soundEnabled) playRadarSound('click');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 border-none',
                  activeTab === 'high_fee'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-white bg-transparent'
                )}
              >
                Mejor Pago ({(availableOrders.filter((o: any) => (o.deliveryFee || 60) >= 100)).length})
              </button>
            </div>
          </div>

          {!localAvailable ? (
            <div className="flex flex-col items-center py-16 text-center space-y-2">
              <Bike className="size-12 text-slate-350 dark:text-zinc-700" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-zinc-400">Escuadrón Desconectado</h4>
              <p className="text-[11px] text-slate-450 dark:text-zinc-550 font-bold max-w-xs mt-1 leading-relaxed">
                Conéctate usando el switch en la parte superior para recibir las alertas satelitales en vivo.
              </p>
            </div>
          ) : filteredAvailableOrders.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center space-y-2">
              <Activity className="size-12 text-teal-500/30 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-zinc-400">Buscando nuevas órdenes...</h4>
              <p className="text-[11px] text-slate-455 dark:text-zinc-550 font-bold max-w-xs mt-1 leading-relaxed">
                Actualmente no hay pedidos pendientes en esta categoría. Te notificaremos al instante en tu radar.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence>
                {filteredAvailableOrders.map((order: any, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    style={{
                      borderRadius: idx % 2 === 0
                        ? '32px 12px 20px 12px'
                        : '12px 32px 12px 20px'
                    }}
                    className="p-4 border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-zinc-950/20 hover:border-teal-500/30 dark:hover:border-teal-500/30 shadow-sm transition-all duration-300 flex flex-col gap-3 group"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/10">
                            Entrega Asegurada
                          </span>
                          <h4 className="text-xs font-black text-slate-805 dark:text-white mt-2 font-serif group-hover:text-teal-600 transition-colors">{order.pharmacy?.name || 'Farmacia Oasis'}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-emerald-500">
                            +{formatCurrency(order.deliveryFee || 60)}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-zinc-550 font-black uppercase tracking-wider">Crédito envío</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-550 dark:text-zinc-400 border-l-2 border-teal-500/30 pl-3 ml-1 font-bold">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span><b className="font-black">Origen:</b> {order.pharmacy?.address || 'Managua, Nicaragua'}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Navigation className="size-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <span><b className="font-black">Destino:</b> {order.deliveryAddress || 'Domicilio paciente'}</span>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                          <p className="text-[8px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest mb-1">Medicamentos en paquete:</p>
                          <p className="text-xs text-slate-705 dark:text-zinc-350 font-medium truncate">
                            {order.items.map((i: any) => `${i.name || 'Medicina'} (x${i.quantity})`).join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => handleAccept(e, order.id)}
                          className="flex-1 h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-650 hover:to-cyan-650 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-teal-500/10 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <Check className="size-4 stroke-[3]" /> Aceptar Misión
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => handleReject(e, order.id)}
                          className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-450 font-black text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer border-none"
                        >
                          Declinación
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Column: Active route / assigned mission panel */}
        <div style={{ borderRadius: '16px 40px 16px 32px' }} className="p-5 border border-slate-200/50 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-200/60 dark:border-white/5">
            <h3 className="text-xs font-black text-slate-805 dark:text-white uppercase tracking-widest font-serif">Tus Misiones Activas</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-black uppercase">
              {activeOrders.length} Asignadas
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center space-y-2">
              <Truck className="size-14 text-slate-350 dark:text-zinc-700 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-zinc-400">Sin Misiones Asignadas</h4>
              <p className="text-[11px] text-slate-455 dark:text-zinc-550 font-bold max-w-xs mt-1 leading-relaxed">
                Activa tu radar, selecciona un objetivo y haz clic en "Aceptar Misión" para comenzar a ganar.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence>
                {activeOrders.map((order, idx) => {
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
                      style={{
                        borderRadius: idx % 2 === 0
                          ? '32px 12px 20px 12px'
                          : '12px 32px 12px 20px'
                      }}
                      className="p-4 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 hover:border-teal-500/30 dark:hover:border-teal-500/30 transition-all cursor-pointer shadow-sm group relative overflow-hidden flex flex-col gap-3"
                      onClick={() => navigate('delivery-detail', order.id)}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/[0.01] rounded-full blur-xl pointer-events-none" />
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-805 dark:text-white truncate font-serif group-hover:text-teal-655 transition-colors">
                              {order.pharmacy?.name || 'Farmacia Oasis'}
                            </h4>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <StatusBadge status={order.status} type="delivery" />
                              {(order as any).cashOnDelivery > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase border border-amber-500/10">
                                  Cobrar en Efectivo
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-880 dark:text-white">
                              {formatCurrency(totalAmount || 180)}
                            </p>
                            <p className="text-[8px] text-slate-400 dark:text-zinc-550 font-black uppercase tracking-wider">Valor Pedido</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-550 dark:text-zinc-400 border-l-2 border-sky-500/30 pl-3 font-bold">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1 font-semibold">{order.delivery_address}</span>
                          </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-slate-550 dark:text-zinc-400 bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-slate-200/50 shadow-inner">
                            <Package className="size-3.5 text-teal-500 shrink-0" />
                            <span className="truncate font-semibold text-[11px]">
                              {order.items.map((i) => `${i.medicine?.name || 'Fármaco'} x${i.quantity}`).join(', ')}
                            </span>
                          </div>
                        )}

                        {action && (
                          <div className="pt-3 border-t border-dashed border-slate-200 dark:border-white/5" onClick={(e) => e.stopPropagation()}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleStatusUpdate(order.id, action.newStatus)}
                              disabled={updatingId === order.id}
                              className={action.className}
                            >
                              {updatingId === order.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <action.icon className="size-4 stroke-[3]" />
                              )}
                              {updatingId === order.id ? 'PROCESANDO...' : action.label}
                            </motion.button>
                          </div>
                        )}

                        <div className="flex items-center justify-end text-[9px] font-black uppercase tracking-widest text-teal-655 dark:text-teal-400 gap-0.5 mt-1">
                          Ver bitácora de misión <ChevronRight className="size-3" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* 5. Fullscreen Radar HUD Overlay Screen */}
      <AnimatePresence>
        {isFullscreenRadar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-white flex flex-col overflow-hidden font-sans select-none"
          >
            {/* Holographic grid scan lines backplate */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,18,18,0)_95%,rgba(0,192,255,0.8)_95%),linear-gradient(90deg,rgba(18,18,18,0)_95%,rgba(0,192,255,0.8)_95%)] bg-[size:30px_30px]" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/20 shadow-lg shadow-cyan-500 animate-[pulse_2s_infinite] pointer-events-none z-[10001]" />

            {/* Tactical top bar hud telemetry */}
            <div className="relative z-[10002] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-cyan-500/20 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (soundEnabled) playRadarSound('click');
                    setIsFullscreenRadar(false);
                    setSelectedRadarOrder(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 border border-slate-300 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-400 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  <ArrowLeft className="size-4 shrink-0" /> VOLVER
                </motion.button>
                <div>
                  <h1 className="text-xs sm:text-sm font-black tracking-widest text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                    <span className="size-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping shrink-0" />
                    OASIS: RADAR HUD v1.2
                  </h1>
                  <p className="text-[8px] sm:text-[9px] text-cyan-650 dark:text-cyan-400/70 font-mono tracking-wider mt-0.5">
                    SYS_STATUS: ACTIVE | GPS_LOCK: TRUE | MAN_GRID: SEC_14
                  </p>
                </div>
              </div>

              {/* Real-time telemetry counters */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-[9px] sm:text-[10px] text-slate-600 dark:text-cyan-400/80">
                <div className="text-left">
                  <span className="block text-slate-400 dark:text-zinc-550 text-[7px] sm:text-[8px] uppercase font-sans">Coordenadas GPS</span>
                  <span className="font-bold tracking-widest text-slate-800 dark:text-white">
                    {driverCoords ? `[${driverCoords.lat.toFixed(4)}, ${driverCoords.lng.toFixed(4)}]` : 'BUSCANDO SATÉLITE...'}
                  </span>
                </div>
                <div className="text-left">
                  <span className="block text-slate-400 dark:text-zinc-550 text-[7px] sm:text-[8px] uppercase font-sans">Blancos Detectados</span>
                  <span className="font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                    {availableOrders.length} PEDIDOS
                  </span>
                </div>
                <div className="text-right hidden md:block">
                  <span className="block text-slate-400 dark:text-zinc-550 text-[8px] uppercase font-sans">Escala Visor</span>
                  <span className="font-bold tracking-widest text-slate-800 dark:text-white">RADIUS: 5.0 KM</span>
                </div>
              </div>
            </div>

            {/* Main Interactive Map HUD visor */}
            <div className="flex-1 relative bg-slate-100 dark:bg-zinc-950">
              <MapView
                markers={radarMarkers}
                center={radarMapCenter}
                height="100%"
                onMarkerClick={handleMarkerClick}
              />

              {/* Tactical sweeping vectors layer */}
              {localAvailable && availableOrders.length === 0 && (
                <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center overflow-hidden bg-cyan-950/[0.02]">
                  <div className="radar-sweep-line-fs" />
                  <div className="radar-circle-fs w-[20vw] h-[20vw]" />
                  <div className="radar-circle-fs w-[40vw] h-[40vw]" />
                  <div className="radar-circle-fs w-[60vw] h-[60vw]" />
                  <div className="radar-circle-fs w-[80vw] h-[80vw]" />

                  {/* Holographic targeting reticle in center */}
                  <div className="absolute size-36 border border-cyan-500/10 rounded-full flex items-center justify-center">
                    <div className="size-16 border border-cyan-500/20 rounded-full flex items-center justify-center">
                      <div className="size-4 bg-cyan-500/30 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>
              )}

              {/* Scanning status banner inside fullscreen view */}
              <div className="hidden sm:flex absolute bottom-6 left-6 z-[401] rounded-2xl bg-white/95 dark:bg-zinc-950/90 border border-slate-200 dark:border-cyan-500/30 px-5 py-3.5 text-[9px] font-mono text-cyan-650 dark:text-cyan-400 uppercase tracking-widest backdrop-blur-xl flex flex-col gap-1.5 shadow-2xl">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
                  <span>MODO DE ESCANEO DE CANALES SATELITALES ACTIVO</span>
                </div>
                <span className="text-[8px] text-slate-400 dark:text-zinc-550">POLLING DEL SERVER CADA 15 SEG PARA NUEVAS RECETAS</span>
              </div>

              {/* Floating holographic card details */}
              <AnimatePresence>
                {selectedRadarOrder && (
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 sm:absolute sm:top-6 sm:right-6 sm:bottom-6 sm:left-auto w-full sm:max-w-md h-[75vh] sm:h-auto z-[1000] rounded-t-[2.5rem] sm:rounded-[2rem] border-t sm:border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-zinc-950/95 backdrop-blur-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 overflow-y-auto select-none text-slate-800 dark:text-white"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                          OBJETIVO DETECTADO
                        </span>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mt-3 font-serif">
                          {selectedRadarOrder.pharmacy?.name || 'Farmacia Oasis'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-550 block">RECOMPENSA CRÉDITO</span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(selectedRadarOrder.deliveryFee || 60)}
                        </span>
                      </div>
                    </div>

                    <hr className="border-slate-200 dark:border-white/10" />

                    {/* Mission route specs */}
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex items-start gap-2.5 text-slate-650 dark:text-zinc-400">
                        <MapPin className="size-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[8px] text-slate-450 dark:text-zinc-550 uppercase block font-sans">ORIGEN RECOLECCIÓN</strong>
                          <span className="text-[11px] leading-relaxed text-slate-800 dark:text-zinc-300 font-bold">{selectedRadarOrder.pharmacy?.address || 'Managua, Nicaragua'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-655 dark:text-zinc-400">
                        <Target className="size-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[8px] text-slate-450 dark:text-zinc-550 uppercase block font-sans">DESTINO DE ENTREGA</strong>
                          <span className="text-[11px] leading-relaxed text-slate-800 dark:text-zinc-300 font-bold">{selectedRadarOrder.deliveryAddress || 'Domicilio paciente'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cargo Manifest list */}
                    {selectedRadarOrder.items && selectedRadarOrder.items.length > 0 && (
                      <div className="bg-slate-100/50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 font-mono">MANIFESTO DE CARGAMENTO</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {selectedRadarOrder.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                              <span className="truncate">{item.name}</span>
                              <span className="font-mono text-cyan-650 dark:text-cyan-400">QTY_x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-auto pt-4 border-t border-slate-200 dark:border-white/10">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          handleAccept(e, selectedRadarOrder.id);
                          setSelectedRadarOrder(null);
                          setIsFullscreenRadar(false);
                        }}
                        className="flex-1 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-605 text-white dark:text-zinc-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2 border-none"
                      >
                        <Check className="size-4 stroke-[3]" /> ACEPTAR E INICIAR MISIÓN
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRadarOrder(null)}
                        className="px-5 h-12 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase cursor-pointer transition-colors border-none"
                      >
                        DESCARTAR
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Embedded Styles for Sweep Radar Vectors */}
      <style jsx global>{`
        @keyframes radar-sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .radar-sweep-line {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 80%;
          height: 80%;
          background: linear-gradient(45deg, rgba(13, 148, 136, 0.25) 0%, transparent 50%);
          transform-origin: 0% 0%;
          animation: radar-sweep 6s linear infinite;
          pointer-events: none;
          border-radius: 0 100% 0 0;
        }
        .radar-circle {
          border: 1px dashed rgba(13, 148, 136, 0.2);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .radar-sweep-line-fs {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 100vw;
          background: linear-gradient(45deg, rgba(6, 182, 212, 0.25) 0%, transparent 50%);
          transform-origin: 0% 0%;
          animation: radar-sweep 7s linear infinite;
          pointer-events: none;
          border-radius: 0 100% 0 0;
        }
        .radar-circle-fs {
          border: 1px dashed rgba(6, 182, 212, 0.15);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .animate-ping-slow {
          animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

    </motion.div>
  );
}
