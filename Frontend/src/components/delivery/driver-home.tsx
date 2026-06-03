'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
      osc.frequency.setValueAtTime(880, ctx.currentTime);
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
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
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
    console.warn('Audio synthesis blocked:', e);
  }
};

const stagger: any = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const fadeUp: any = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
};

export function DriverHome() {
  const { user, setNotification, navigate, isElderlyMode } = useAuthStore();
  const queryClient = useQueryClient();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localAvailable, setLocalAvailable] = useState(true);
  const [isFullscreenRadar, setIsFullscreenRadar] = useState(false);
  const [selectedRadarOrder, setSelectedRadarOrder] = useState<any | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'high_fee'>('all');
  const [newlyAssignedOrder, setNewlyAssignedOrder] = useState<any | null>(null);
  const prevActiveOrdersRef = useRef<any[]>([]);
  const isFirstLoadRef = useRef(true);

  const driverId = user?.id || '';
  const firstName = user?.name?.split(' ')[0] || 'Repartidor';

  const { data: stats } = useDriverEarnings(localAvailable);
  const { data: availableOrders = [], isLoading: availableLoading } = useAvailableDeliveries(localAvailable);
  const { data: activeOrders = [], isLoading: activeLoading } = useAssignedDeliveries(!!driverId);

  const { mutateAsync: acceptOrder } = useAcceptDelivery();
  const { mutateAsync: rejectOrder } = useRejectDelivery();
  const updateDeliveryStatus = useUpdateDeliveryStatus();

  const isLoading = activeLoading || availableLoading;

  useEffect(() => {
    if (!activeOrders || activeOrders.length === 0) {
      prevActiveOrdersRef.current = [];
      isFirstLoadRef.current = false;
      return;
    }

    if (isFirstLoadRef.current) {
      prevActiveOrdersRef.current = activeOrders;
      isFirstLoadRef.current = false;
      return;
    }

    // Find any order in activeOrders with status === 'assigned' that wasn't in our previous list
    const newlyAssigned = activeOrders.find((order: any) => {
      if (order.status !== 'assigned') return false;

      // Ensure assignment hasn't already been seen/interacted with in this session
      if (typeof window !== 'undefined') {
        try {
          const seenIds = JSON.parse(localStorage.getItem('oasis_seen_assignments') || '[]');
          if (seenIds.includes(order.id)) return false;
        } catch (e) {}
      }

      const wasSeen = prevActiveOrdersRef.current.some((prev: any) => prev.id === order.id);
      return !wasSeen;
    });

    if (newlyAssigned) {
      setNewlyAssignedOrder(newlyAssigned);
      if (soundEnabled) playRadarSound('ping');
    }

    prevActiveOrdersRef.current = activeOrders;
  }, [activeOrders, soundEnabled]);

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
          console.warn('Radar GPS error:', err.message);
          setDriverCoords({ lat: 12.1364, lng: -86.2514 });
        },
        { enableHighAccuracy: true }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('Radar GPS watch error:', err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [localAvailable]);

  useEffect(() => {
    if (localAvailable && availableOrders.length > 0 && soundEnabled) {
      playRadarSound('ping');
    }
  }, [availableOrders.length, localAvailable, soundEnabled]);

  const radarMarkers = useMemo(() => {
    const list: any[] = [];
    if (driverCoords) {
      list.push({
        id: 'driver',
        lat: driverCoords.lat,
        lng: driverCoords.lng,
        type: 'driver',
        label: 'Tu posición',
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
          label: `Destino: Pedido #${order.id.slice(-6)}`,
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
      
      // Ensure the order is added to seenIds immediately to prevent assignment popup race conditions
      if (typeof window !== 'undefined') {
        try {
          const seenIds = JSON.parse(localStorage.getItem('oasis_seen_assignments') || '[]');
          if (!seenIds.includes(id)) {
            seenIds.push(id);
            localStorage.setItem('oasis_seen_assignments', JSON.stringify(seenIds));
          }
        } catch (e) {}
      }

      // 1. Perform the API call to accept the order first to set the deliveryDriverId on the server
      await acceptOrder(id);
      
      // 2. Set the query client cache for optimistic updates
      if (orderToAccept) {
        queryClient.setQueryData(['deliveries', 'assigned'], (old: any[] = []) => [
          ...old,
          { ...orderToAccept, status: 'assigned', deliveryDriverId: driverId },
        ]);
      }
      
      // 3. Now navigate to the detail page safely without triggering a 403 Forbidden race condition
      navigate('delivery-detail', id);
      setNotification({ type: 'success', message: '¡Misión aceptada con éxito!' });
    } catch (err) {
      console.error('Error accepting order:', err);
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
          className: 'bg-teal-500 hover:bg-teal-600 text-white font-black text-[9px] uppercase tracking-widest shadow-md h-10 rounded-full transition-all duration-300 border-none w-full flex items-center justify-center gap-1.5 cursor-pointer',
        };
      case 'picked_up':
        return {
          label: 'Iniciar ruta al paciente',
          icon: Navigation,
          newStatus: 'in_transit' as const,
          className: 'bg-sky-500 hover:bg-sky-600 text-white font-black text-[9px] uppercase tracking-widest shadow-md h-10 rounded-full transition-all duration-300 border-none w-full flex items-center justify-center gap-1.5 cursor-pointer',
        };
      case 'in_transit':
        return {
          label: 'Marcar como entregado',
          icon: CheckCircle2,
          newStatus: 'delivered' as const,
          className: 'bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest shadow-md h-10 rounded-full transition-all duration-300 border-none w-full flex items-center justify-center gap-1.5 cursor-pointer',
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
      <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
        <div className="shimmer rounded-[40px_16px_40px_16px] h-28 w-full opacity-70" />
        <div className="grid grid-cols-3 gap-4">
          <div className="shimmer rounded-2xl h-24 opacity-70" />
          <div className="shimmer rounded-2xl h-24 opacity-70" />
          <div className="shimmer rounded-2xl h-24 opacity-70" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={cn(
        "space-y-6 pb-24 font-sans relative overflow-visible px-1 sm:px-0",
        isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_button]:text-sm [&_button]:h-12"
      )} 
      variants={stagger} 
      initial="initial" 
      animate="animate"
    >
      {/* Background Ambience */}
      <div className="absolute top-[25%] left-[-10%] size-96 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-96 rounded-full bg-gradient-to-br from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* 1. Curved Top Visor Header — Cardless, flowing directly from top */}
      <div className="bg-teal-500/10 dark:bg-zinc-950/40 border-b border-dashed border-teal-500/20 rounded-b-[48px] py-7 px-5 sm:px-8 -mx-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/3" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="size-12 rounded-[20px_8px_16px_8px] bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Bike className="size-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-serif">
                Hola, {firstName}
              </h2>
              <Sparkles className="size-4 text-yellow-500 fill-yellow-400/20 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold mt-0.5">
              {activeOrders.length > 0
                ? `Misiones activas: ${activeOrders.length}. ¡Seguridad ante todo!`
                : 'Visor de radar táctico enlazado y listo.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-1.5 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-full px-3.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>Central Oasis Conectada</span>
          </div>
          
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playRadarSound('click');
            }}
            className={cn(
              'size-9 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-sm',
              soundEnabled
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20'
                : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-400 dark:text-zinc-500 hover:bg-white/10'
            )}
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
        </div>
      </div>

      {/* 2. Flat Dashboard Stats Grid — Unified Telemetry Board (Zero Card Borders) */}
      <div className="bg-slate-500/[0.02] dark:bg-zinc-950/30 border border-slate-200/30 dark:border-white/5 rounded-[32px] p-4 flex items-center justify-around shadow-lg backdrop-blur-md">
        
        {/* Availability Telemetry Capsule */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Estado</span>
          <button
            onClick={() => {
              setLocalAvailable(!localAvailable);
              if (soundEnabled) playRadarSound('success');
            }}
            className={cn(
              'h-11 px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer border flex items-center gap-2 shadow-md',
              localAvailable
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            )}
          >
            <span className={cn('size-2 rounded-full', localAvailable ? 'bg-emerald-500 animate-ping' : 'bg-rose-500')} />
            {localAvailable ? 'ACTIVO' : 'PAUSADO'}
          </button>
        </div>

        {/* Vertical Separator */}
        <div className="w-[1px] h-10 bg-slate-200/40 dark:bg-white/5" />

        {/* Daily Earnings stats */}
        <div className="flex flex-col items-center text-center">
          <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Créditos Hoy</span>
          <div className="mt-1">
            <p className="text-base font-black text-slate-800 dark:text-white font-mono tracking-tight">
              {formatCurrency(stats?.totalEarnings ?? 0)}
            </p>
            <p className="text-[7.5px] text-emerald-500 font-extrabold uppercase mt-0.5 tracking-wider">{stats?.totalDeliveries ?? 0} misiones</p>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="w-[1px] h-10 bg-slate-200/40 dark:bg-white/5" />

        {/* Reputation stats */}
        <div className="flex flex-col items-center text-center">
          <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Rendimiento</span>
          <div className="mt-1">
            <p className="text-base font-black text-slate-800 dark:text-white font-mono flex items-center justify-center gap-0.5">
              {stats?.rating ?? 5.0} <Star className="size-3 text-amber-500 fill-amber-500/20 inline shrink-0 -mt-0.5" />
            </p>
            <p className="text-[7.5px] text-teal-600 dark:text-teal-400 font-black uppercase tracking-wider mt-0.5">ELITE DRIVER</p>
          </div>
        </div>

      </div>

      {/* 3. The Radar Preview Panel — Floating HUD scoped Map */}
      <div className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 rounded-[40px_16px_40px_16px] backdrop-blur-md p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex size-7.5 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/15">
              <Radio className="size-4 text-teal-500 animate-pulse animate-bounce-slow" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Radar Satelital</h3>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (soundEnabled) playRadarSound('success');
              setIsFullscreenRadar(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-4 py-2 rounded-full text-[8.5px] font-black uppercase tracking-widest cursor-pointer border-none shadow-sm"
          >
            <Maximize2 className="size-3.5 shrink-0" /> Pantalla Completa
          </motion.button>
        </div>

        {/* Mini Radar scope preview */}
        <div className="relative rounded-[32px_12px_24px_12px] overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-inner h-64 bg-zinc-950">
          {localAvailable ? (
            <MapView
              markers={radarMarkers}
              center={radarMapCenter}
              height="100%"
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-zinc-950/70 backdrop-blur-sm z-[500] text-center p-6">
              <Bike className="size-12 text-slate-400 dark:text-zinc-650 mb-2 animate-bounce-slow" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-550 dark:text-zinc-450">Radar Inactivo</h4>
              <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold max-w-xs mt-1 leading-relaxed">Conéctate para recibir coordenadas satelitales en vivo.</p>
            </div>
          )}

          {localAvailable && availableOrders.length === 0 && (
            <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center overflow-hidden">
              <div className="radar-sweep-line" />
              <div className="radar-circle w-28 h-28" />
              <div className="radar-circle w-56 h-56 animate-ping-slow" />
              <div className="absolute bottom-4 left-4 z-[401] rounded-xl bg-zinc-950/90 border border-teal-500/20 px-3 py-1.5 text-[8px] font-black text-teal-400 uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-teal-400 animate-ping" />
                Rastreando zona...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Tabbed Misiones Feed — Cardless tab lists divided by clinic dashed separators */}
      <div className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 rounded-[40px_16px_40px_16px] backdrop-blur-md p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-dashed border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex size-7.5 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/15">
              <Truck className="size-4 text-indigo-500" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-zinc-400">Canal de Misiones</h3>
          </div>

          {/* Inline filters — Highly ergonomic and glow-styled */}
          <div className="flex bg-slate-500/[0.04] dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5 w-fit">
            <button
              onClick={() => {
                setActiveTab('all');
                if (soundEnabled) playRadarSound('click');
              }}
              className={cn(
                'px-4 py-2.5 h-11 rounded-xl text-[9.5px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 border-none flex items-center justify-center gap-1.5 shadow-sm',
                activeTab === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm border border-teal-500/10'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-white bg-transparent shadow-none'
              )}
            >
              Disponibles ({availableOrders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('high_fee');
                if (soundEnabled) playRadarSound('click');
              }}
              className={cn(
                'px-4 py-2.5 h-11 rounded-xl text-[9.5px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 border-none flex items-center justify-center gap-1.5 shadow-sm',
                activeTab === 'high_fee'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm border border-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-white bg-transparent shadow-none'
              )}
            >
              Premium Pago
            </button>
          </div>
        </div>

        {/* Tab content splits */}
        <div className="divide-y divide-dashed divide-slate-200/60 dark:divide-white/5">
          
          {/* Active Missions (Fixed header priority) */}
          {activeOrders.length > 0 && (
            <div className="pb-3.5 space-y-3">
              <p className="text-[8.5px] font-black text-sky-655 dark:text-sky-400 uppercase tracking-[0.2em] mb-2 pl-2">Misiones en Curso</p>
              {activeOrders.map((order, idx) => {
                const action = getActionForOrder(order.status);
                const totalAmount = order.items
                  ? order.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
                  : 0;

                return (
                  <motion.div
                    key={order.id}
                    variants={fadeUp}
                    className="p-3 hover:bg-slate-500/[0.03] dark:hover:bg-white/[0.01] cursor-pointer transition-all duration-200 relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl"
                    onClick={() => navigate('delivery-detail', order.id)}
                  >
                    {/* Glow sidebar indicating running status */}
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-sky-500 rounded-full" />
                    
                    <div className="flex items-center gap-4 min-w-0 pl-2">
                      <div className="size-10 rounded-lg bg-sky-500/10 border border-sky-500/15 flex items-center justify-center text-sky-550 shrink-0">
                        <Truck className="size-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white truncate font-serif">
                            {order.pharmacy?.name || 'Farmacia Oasis'}
                          </h4>
                          <StatusBadge status={order.status} type="delivery" />
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold mt-1.5 flex items-center gap-1">
                          <MapPin className="size-3 text-rose-500" />
                          <span className="truncate">{order.delivery_address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pl-12 md:pl-0 shrink-0 justify-between md:justify-end w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="text-left md:text-right font-mono font-bold text-xs space-y-0.5 text-slate-800 dark:text-zinc-200">
                        <p className="text-emerald-500">+{formatCurrency(order.deliveryFee || 60)} fee</p>
                        <p className="text-[9px] text-slate-400 dark:text-zinc-550 font-black">VAL: {formatCurrency(totalAmount)}</p>
                      </div>

                      {action && (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleStatusUpdate(order.id, action.newStatus)}
                          disabled={updatingId === order.id}
                          className={cn(action.className, "!w-fit !px-4 !h-9 text-[8px]")}
                        >
                          {updatingId === order.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <action.icon className="size-3 shrink-0 stroke-[3]" />
                          )}
                          {updatingId === order.id ? 'PROCESANDO...' : action.label}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Available Jobs list */}
          <div className="pt-3.5 space-y-3">
            <p className="text-[8.5px] font-black text-emerald-655 dark:text-emerald-450 uppercase tracking-[0.2em] mb-2 pl-2">Órdenes Disponibles en Radar</p>
            
            {!localAvailable ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Bike className="size-10 text-slate-350 dark:text-zinc-700 mb-2" />
                <p className="text-xs text-slate-450 dark:text-zinc-500 font-bold">Conéctate para activar el radar satelital.</p>
              </div>
            ) : filteredAvailableOrders.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Activity className="size-8 text-teal-500/20 animate-pulse mb-2" />
                <p className="text-xs text-slate-450 dark:text-zinc-500 font-bold">No hay pedidos adicionales en esta zona.</p>
              </div>
            ) : (
              filteredAvailableOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  variants={fadeUp}
                  className="py-4 px-3 hover:bg-slate-500/[0.03] dark:hover:bg-white/[0.01] cursor-pointer transition-all duration-200 relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl"
                  onClick={() => navigate('delivery-detail', order.id)}
                >
                  {/* Glowing neon green accent row border */}
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-full" />

                  <div className="flex items-center gap-4 min-w-0 pl-2">
                    <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
                      <Package className="size-5 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-800 dark:text-white truncate font-serif">
                          {order.pharmacy?.name || 'Farmacia Oasis'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/10 shrink-0">
                          Radar Activo
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold mt-1.5 flex items-center gap-1">
                        <MapPin className="size-3 text-rose-500" />
                        <span className="truncate">Destino: {order.deliveryAddress || 'Domicilio paciente'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-12 md:pl-0 shrink-0 justify-between md:justify-end w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="text-left md:text-right font-mono font-bold text-xs space-y-0.5 text-slate-800 dark:text-white">
                      <p className="text-emerald-500">+{formatCurrency(order.deliveryFee || 60)} fee</p>
                      <p className="text-[8px] text-slate-400 dark:text-zinc-555 font-black uppercase tracking-wide">Recibe crédito</p>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => handleAccept(e, order.id)}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-black text-[8.5px] uppercase tracking-widest cursor-pointer border-none shadow-sm flex items-center gap-1"
                      >
                        <Check className="size-3 stroke-[3]" /> Aceptar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => handleReject(e, order.id)}
                        className="px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-450 font-black text-[8.5px] uppercase cursor-pointer border-none"
                      >
                        Omitir
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Fullscreen Radar HUD Overlay Screen */}
      <AnimatePresence>
        {isFullscreenRadar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-white flex flex-col overflow-hidden font-sans select-none"
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
                  <span className="block text-slate-400 dark:text-zinc-555 text-[7px] sm:text-[8px] uppercase font-sans">Coordenadas GPS</span>
                  <span className="font-bold tracking-widest text-slate-800 dark:text-white">
                    {driverCoords ? `[${driverCoords.lat.toFixed(4)}, ${driverCoords.lng.toFixed(4)}]` : 'BUSCANDO SATÉLITE...'}
                  </span>
                </div>
                <div className="text-left">
                  <span className="block text-slate-400 dark:text-zinc-555 text-[7px] sm:text-[8px] uppercase font-sans">Blancos Detectados</span>
                  <span className="font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                    {availableOrders.length} PEDIDOS
                  </span>
                </div>
                <div className="text-right hidden md:block">
                  <span className="block text-slate-400 dark:text-zinc-555 text-[8px] uppercase font-sans">Escala Visor</span>
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
                <span className="text-[8px] text-slate-400 dark:text-zinc-555">POLLING DEL SERVER CADA 15 SEG PARA NUEVAS RECETAS</span>
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
                        <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-555 block">RECOMPENSA CRÉDITO</span>
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
                          <strong className="text-[8px] text-slate-450 dark:text-zinc-555 uppercase block font-sans">ORIGEN RECOLECCIÓN</strong>
                          <span className="text-[11px] leading-relaxed text-slate-800 dark:text-zinc-300 font-bold">{selectedRadarOrder.pharmacy?.address || 'Managua, Nicaragua'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-655 dark:text-zinc-400">
                        <Target className="size-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[8px] text-slate-455 dark:text-zinc-555 uppercase block font-sans">DESTINO DE ENTREGA</strong>
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
                        className="flex-1 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white dark:text-zinc-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2 border-none"
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

      {/* 4. Highly responsive dynamic assignment modal overlay */}
      <AnimatePresence>
        {newlyAssignedOrder && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-zinc-905 border border-slate-200 dark:border-zinc-800 text-slate-850 dark:text-white rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Close Button / X to keep it waiting in queue */}
              <button
                onClick={() => {
                  const orderId = newlyAssignedOrder.id;
                  if (typeof window !== 'undefined') {
                    try {
                      const seenIds = JSON.parse(localStorage.getItem('oasis_seen_assignments') || '[]');
                      if (!seenIds.includes(orderId)) {
                        seenIds.push(orderId);
                        localStorage.setItem('oasis_seen_assignments', JSON.stringify(seenIds));
                      }
                    } catch (e) {}
                  }
                  setNewlyAssignedOrder(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-400 dark:text-zinc-500 hover:text-slate-650 dark:hover:text-white transition-colors duration-200 cursor-pointer"
                title="Mantener en espera"
              >
                <X className="size-5" />
              </button>

              <div className="text-center mb-6">
                <div className="size-14 bg-teal-500/15 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-4 border border-teal-500/20 shadow-md">
                  <Truck className="size-8" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider font-serif">¡Misión Asignada!</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-450 mt-2 font-semibold leading-relaxed">
                  Se te ha asignado un nuevo pedido de entrega. ¿Qué deseas hacer?
                </p>
              </div>

              {/* Order quick highlights */}
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 space-y-3.5 mb-6 text-left">
                <div>
                  <span className="text-[7.5px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest block">ID de la Orden</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white font-mono">#{newlyAssignedOrder.id.slice(-8)}</span>
                </div>
                <div>
                  <span className="text-[7.5px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest block">Farmacia de Origen</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{newlyAssignedOrder.pharmacy?.name || 'Farmacia Oasis'}</span>
                </div>
                <div>
                  <span className="text-[7.5px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest block">Destino de Entrega</span>
                  <p className="text-xs font-medium text-slate-700 dark:text-zinc-350 truncate">{newlyAssignedOrder.delivery_address || newlyAssignedOrder.deliveryAddress}</p>
                </div>
                {newlyAssignedOrder.deliveryFee && (
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-white/5">
                    <span className="text-[7.5px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest">Ganancia</span>
                    <span className="text-xs font-black text-teal-600 dark:text-teal-400 font-mono">{formatCurrency(newlyAssignedOrder.deliveryFee)}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    const orderId = newlyAssignedOrder.id;
                    if (typeof window !== 'undefined') {
                      try {
                        const seenIds = JSON.parse(localStorage.getItem('oasis_seen_assignments') || '[]');
                        if (!seenIds.includes(orderId)) {
                          seenIds.push(orderId);
                          localStorage.setItem('oasis_seen_assignments', JSON.stringify(seenIds));
                        }
                      } catch (e) {}
                    }
                    setNewlyAssignedOrder(null);
                    if (soundEnabled) playRadarSound('success');
                    try {
                      await updateDeliveryStatus.mutateAsync({
                        id: orderId,
                        data: { status: 'picked_up' }
                      });
                      navigate('delivery-detail', orderId);
                      setNotification({ type: 'success', message: '¡Estado cambiado a Recogido!' });
                    } catch (err) {
                      setNotification({ type: 'error', message: 'Error al cambiar estado' });
                    }
                  }}
                  className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg border-0"
                >
                  <PackageOpen className="size-4 shrink-0" />
                  Recoger en Farmacia
                </button>

                <button
                  onClick={() => {
                    const orderId = newlyAssignedOrder.id;
                    if (typeof window !== 'undefined') {
                      try {
                        const seenIds = JSON.parse(localStorage.getItem('oasis_seen_assignments') || '[]');
                        if (!seenIds.includes(orderId)) {
                          seenIds.push(orderId);
                          localStorage.setItem('oasis_seen_assignments', JSON.stringify(seenIds));
                        }
                      } catch (e) {}
                    }
                    setNewlyAssignedOrder(null);
                    if (soundEnabled) playRadarSound('click');
                    navigate('delivery-detail', orderId);
                  }}
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center gap-2 border border-slate-200/50 dark:border-white/5"
                >
                  <Navigation className="size-4 shrink-0" />
                  Ver Detalles
                </button>

                <button
                  onClick={() => {
                    const orderId = newlyAssignedOrder.id;
                    if (typeof window !== 'undefined') {
                      try {
                        const seenIds = JSON.parse(localStorage.getItem('oasis_seen_assignments') || '[]');
                        if (!seenIds.includes(orderId)) {
                          seenIds.push(orderId);
                          localStorage.setItem('oasis_seen_assignments', JSON.stringify(seenIds));
                        }
                      } catch (e) {}
                    }
                    setNewlyAssignedOrder(null);
                    if (soundEnabled) playRadarSound('click');
                  }}
                  className="w-full h-10 bg-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400 font-bold text-[9px] uppercase tracking-widest cursor-pointer text-center"
                >
                  Mantener en Espera
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
