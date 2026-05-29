'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { MapView } from '@/components/common/map-view';
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
  Maximize2,
  Minimize2,
  Radio,
  Target,
  BellRing,
  Compass,
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
  const queryClient = useQueryClient();
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

  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedRadarOrder, setSelectedRadarOrder] = useState<any | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Geolocation tracking for available freelance radar map
  useEffect(() => {
    if (!localAvailable) {
      setDriverCoords(null);
      return;
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      // Fetch initial position
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Radar driver geolocation error:', err.message);
          // Default to Managua central coordinates if GPS is unavailable
          setDriverCoords({ lat: 12.1364, lng: -86.2514 });
        },
        { enableHighAccuracy: true }
      );

      // Continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('Radar geolocation watch error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [localAvailable]);

  // Construct dynamic markers for the Tactical Radar Map
  const radarMarkers = useMemo(() => {
    const list: any[] = [];

    // 1. Driver Current Location Marker
    if (driverCoords) {
      list.push({
        id: 'driver',
        lat: driverCoords.lat,
        lng: driverCoords.lng,
        type: 'driver',
        label: 'Tu Ubicación Actual',
      });
    }

    // 2. Available freelance orders (pharmacy pickups and patient destinations)
    availableOrders.forEach((order: any) => {
      const pLat = order.pickup_lat ?? order.pickupLat;
      const pLng = order.pickup_lng ?? order.pickupLng;
      const dLat = order.delivery_lat ?? order.deliveryLat;
      const dLng = order.delivery_lng ?? order.deliveryLng;

      // Add Pharmacy Pickup marker
      if (pLat && pLng) {
        list.push({
          id: `pickup-${order.id}`,
          lat: pLat,
          lng: pLng,
          type: 'pharmacy',
          label: `Recoger en: ${order.pharmacy?.name || 'Farmacia'} (Tarifa: ${formatCurrency(order.deliveryFee || 60)})`,
          orderRef: order,
        });
      }

      // Add Patient Delivery marker
      if (dLat && dLng) {
        list.push({
          id: `delivery-${order.id}`,
          lat: dLat,
          lng: dLng,
          type: 'destination',
          label: `Entregar a Paciente (Pedido: #${order.id.slice(-6)})`,
          orderRef: order,
        });
      }
    });

    return list;
  }, [driverCoords, availableOrders]);

  const radarMapCenter = useMemo((): [number, number] => {
    if (driverCoords) return [driverCoords.lat, driverCoords.lng];
    return [12.1364, -86.2514]; // Managua
  }, [driverCoords]);

  const handleMarkerClick = (marker: any) => {
    if (marker.orderRef) {
      setSelectedRadarOrder(marker.orderRef);
    }
  };

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
      // Optimización de UX de Oasis: Guardar en caché y navegar inmediatamente
      const orderToAccept = availableOrders.find((o: any) => o.id === id);
      if (orderToAccept) {
        queryClient.setQueryData(['delivery-orders', id], {
          ...orderToAccept,
          status: 'accepted',
          deliveryDriverId: driverId,
        });
      }
      
      // Redirigir de forma inmediata
      navigate('delivery-detail', id);
      
      // Procesar en segundo plano
      await acceptOrder(id);
      setNotification({ type: 'success', message: '¡Pedido aceptado con éxito!' });
    } catch {
      setNotification({ type: 'error', message: 'Error al aceptar el pedido' });
      navigate('inicio-repartidor');
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
          className: 'bg-teal-500 hover:bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/10 h-10 rounded-full transition-all duration-300',
        };
      case 'picked_up':
        return {
          label: 'Iniciar ruta',
          icon: Navigation,
          newStatus: 'in_transit' as const,
          className: 'bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-sky-500/10 h-10 rounded-full transition-all duration-300',
        };
      case 'in_transit':
        return {
          label: 'Marcar entregado',
          icon: CheckCircle2,
          newStatus: 'delivered' as const,
          className: 'bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 h-10 rounded-full transition-all duration-300',
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

      {/* Tactical Radar Map Module */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-zinc-800/80 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl shadow-2xl p-6 transition-all duration-500">
          
          {/* Card Header controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 shadow-inner">
                <Radio className="size-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  Radar Táctico Oasis 
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Escaneo en Vivo
                  </span>
                </h3>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Haz clic en un marcador de farmacia en el mapa para previsualizar los detalles del envío.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setMapExpanded(!mapExpanded)}
              className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5 shadow-sm transition-all duration-300 cursor-pointer self-start sm:self-center"
            >
              {mapExpanded ? (
                <>
                  <Minimize2 className="size-3.5" /> Contraer
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5" /> Ampliar Radar
                </>
              )}
            </button>
          </div>

          {/* Map display */}
          <div 
            className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800/80 shadow-inner transition-all duration-500 ease-out bg-slate-50 dark:bg-zinc-950"
            style={{ height: mapExpanded ? '520px' : '280px' }}
          >
            {/* The actual dynamic MapView */}
            {localAvailable ? (
              <MapView
                markers={radarMarkers}
                center={radarMapCenter}
                height="100%"
                onMarkerClick={handleMarkerClick}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-zinc-950/50 backdrop-blur-sm z-[500] text-center">
                <Bike className="size-16 text-muted-foreground/30 mb-3 animate-bounce" />
                <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Repartidor Desconectado</h4>
                <p className="text-xs text-muted-foreground/70 max-w-xs mt-1">Conéctate en la parte superior para activar el radar táctico de Managua.</p>
              </div>
            )}

            {/* Tactical Radar Overlay Sweep Line */}
            {localAvailable && availableOrders.length === 0 && (
              <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center overflow-hidden">
                {/* Sweep Sector */}
                <div className="radar-sweep-line" />
                
                {/* Sonar rings */}
                <div className="radar-circle w-32 h-32" />
                <div className="radar-circle w-64 h-64 animate-ping-slow" />
                <div className="radar-circle w-96 h-96" />
                
                {/* Floating status label inside map */}
                <div className="absolute bottom-6 left-6 z-[401] rounded-2xl bg-zinc-950/85 border border-teal-500/20 px-4 py-2 text-[10px] font-black text-teal-400 uppercase tracking-widest backdrop-blur-md flex items-center gap-2">
                  <span className="size-2 rounded-full bg-teal-400 animate-ping" />
                  Buscando Prescripciones Cercanas...
                </div>
              </div>
            )}

            {/* Custom Styles for the tactical radar effect */}
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
                width: 70%;
                height: 70%;
                background: linear-gradient(45deg, rgba(13, 148, 136, 0.15) 0%, transparent 60%);
                transform-origin: 0% 0%;
                animation: radar-sweep 5s linear infinite;
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
              .animate-ping-slow {
                animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
              }
            `}</style>

            {/* Immersive Floating Order Detail Card inside map */}
            <AnimatePresence>
              {selectedRadarOrder && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-sm z-[1000] rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-5 shadow-2xl flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-teal-500 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
                        Pedido de Farmacia
                      </span>
                      <h4 className="text-sm font-black text-foreground mt-1.5">
                        {selectedRadarOrder.pharmacy?.name || 'Farmacia Oasis'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground block">Ganancia Est.</span>
                      <span className="text-base font-black text-emerald-500">
                        {formatCurrency(selectedRadarOrder.deliveryFee || 60)}
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-white/5" />

                  {/* Route points */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-3.5 text-teal-500 shrink-0" />
                      <span className="truncate"><strong>Desde:</strong> {selectedRadarOrder.pharmacy?.address || 'Managua, Nicaragua'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="size-3.5 text-rose-500 shrink-0" />
                      <span className="truncate"><strong>Hacia:</strong> {selectedRadarOrder.deliveryAddress || 'Dirección de entrega'}</span>
                    </div>
                  </div>

                  {/* Medicine list preview */}
                  {selectedRadarOrder.items && selectedRadarOrder.items.length > 0 && (
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Medicamentos a entregar</p>
                      <div className="max-h-16 overflow-y-auto space-y-1 pr-1">
                        {selectedRadarOrder.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-[11px] font-semibold text-foreground">
                            <span className="truncate">{item.name}</span>
                            <span className="text-muted-foreground">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={(e) => {
                        handleAccept(e, selectedRadarOrder.id);
                        setSelectedRadarOrder(null);
                      }}
                      className="flex-1 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 border-0"
                    >
                      <Check className="size-3.5" /> Aceptar Pedido
                    </button>
                    <button
                      onClick={() => setSelectedRadarOrder(null)}
                      className="px-3.5 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase cursor-pointer transition-colors border-0"
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

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
                        <motion.button
                          whileHover={{ scale: 1.02, y: -0.5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => handleAccept(e, order.id)}
                          className="flex-1 h-9 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/10 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <Check className="size-3.5 stroke-[3]" /> Aceptar Pedido
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => handleReject(e, order.id)}
                          className="h-9 px-4 rounded-full bg-slate-500/10 border border-border/40 text-slate-650 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-500/20 transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="size-3.5" /> Rechazar
                        </motion.button>
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
                                'w-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none',
                                action.className
                              )}
                            >
                              {updatingId === order.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <action.icon className="size-4" />
                              )}
                              {updatingId === order.id ? 'ACTUALIZANDO...' : action.label}
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
