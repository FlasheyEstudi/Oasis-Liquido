'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { 
  useDeliveryOrders, 
  useUpdateDeliveryStatus, 
  useReviews,
  useDriverEarnings,
  getHookErrorMessage 
} from '@/hooks/use-api';
import { timeAgo, formatCurrency } from '@/utils/helpers';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  PackageCheck,
  Map as MapIcon,
  Star,
  AlertCircle,
  Radio,
  Loader2,
  DollarSign,
  TrendingUp,
  Award,
  Eye,
  Download,
  FileText,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function DriverDashboard() {
  const { user, setNotification } = useAuthStore();
  const driverId = user?.id;

  const { data: stats, isLoading: statsLoading } = useDriverEarnings(!!driverId);

  const {
    data: ordersResult,
    isLoading: ordersLoading,
    error,
    refetch,
  } = useDeliveryOrders({ status: 'delivered', limit: 20 }, !!driverId);

  const {
    data: reviewsResult,
    isLoading: reviewsLoading,
  } = useReviews({ targetId: user?.id, targetType: 'driver' });

  const updateStatus = useUpdateDeliveryStatus();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const orders = ordersResult?.data ?? [];
  const reviews = reviewsResult?.data ?? [];
  const firstName = user?.name?.split(' ')[0] || 'Repartidor';

  // --- SOS Emergency State & Handlers ---
  const [showSosModal, setShowSosModal] = useState(false);
  const [isAuraTriggering, setIsAuraTriggering] = useState(false);
  const [auraCountdown, setAuraCountdown] = useState(3);
  const [isAuraSending, setIsAuraSending] = useState(false);
  const [auraTriggered, setAuraTriggered] = useState(false);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const isLongPressRef = useRef(false);
  const countdownIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startAuraTrigger = () => {
    setIsAuraTriggering(true);
    setAuraCountdown(3);
    setAuraTriggered(false);

    countdownIntervalRef.current = setInterval(() => {
      setAuraCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          sendAuraAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelAuraTrigger = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsAuraTriggering(false);
  };

  const sendAuraAlert = () => {
    setIsAuraSending(true);
    try {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            apiClient.post('/patient/emergency', { lat, lng })
              .then((res) => {
                if (res.data?.success || res.status === 200) {
                  setAuraTriggered(true);
                  toast.success('Oasis Aura: ¡Auxilio de emergencia enviado a la farmacia y soporte central!');
                } else {
                  throw new Error('No se pudo procesar la alerta');
                }
              })
              .catch((err) => {
                console.error('Aura API Error:', err);
                toast.error('No pudimos enviar la señal. Intenta de nuevo.');
                setIsAuraTriggering(false);
              })
              .finally(() => {
                setIsAuraSending(false);
              });
          },
          (error) => {
            console.error('Geolocation Error:', error);
            apiClient.post('/patient/emergency', { lat: 12.115, lng: -86.236 })
              .then(() => {
                setAuraTriggered(true);
                toast.success('Oasis Aura: ¡Auxilio enviado con coordenadas de Managua (GPS deshabilitado)!');
              })
              .catch(() => {
                toast.error('Por favor habilita la geolocalización para usar la alerta de emergencia.');
                setIsAuraTriggering(false);
              })
              .finally(() => {
                setIsAuraSending(false);
              });
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        throw new Error('Geolocalización no soportada');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al obtener ubicación actual.');
      setIsAuraSending(false);
      setIsAuraTriggering(false);
    }
  };

  const handleSosStart = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPressRef.current = false;
    startTimeRef.current = Date.now();
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowSosModal(true);
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }, 700);
  };

  const handleSosEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const duration = Date.now() - startTimeRef.current;
    
    if (startTimeRef.current > 0) {
      if (!isLongPressRef.current && duration < 700) {
        window.location.href = 'tel:128';
      }
      startTimeRef.current = 0;
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await updateStatus.mutateAsync({ id: orderId, data: { status: status as any } });
      toast.success('Estado actualizado');
      refetch();
    } catch (err) {
      toast.error('Error al actualizar');
    } finally {
      setUpdatingId(null);
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadInvoice = async (order: any) => {
    const saleId = order.sale?.id || order.saleId;
    if (!saleId) {
      toast.error('No hay venta asociada a esta entrega');
      return;
    }
    setDownloadingId(order.id);
    try {
      const response = await apiClient.get(`/sales/${saleId}/receipt`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${order.id.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Factura descargada correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al descargar la factura');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewInvoice = async (order: any) => {
    const saleId = order.sale?.id || order.saleId;
    if (!saleId) {
      toast.error('No hay venta asociada a esta entrega');
      return;
    }
    setDownloadingId(order.id);
    try {
      const response = await apiClient.get(`/sales/${saleId}/receipt`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      toast.error('Error al visualizar la factura');
    } finally {
      setDownloadingId(null);
    }
  };

  if (ordersLoading || statsLoading) {
    return (
      <div className="delivery-container space-y-6 !max-w-2xl mt-4">
        <div className="shimmer h-32 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="shimmer h-24 rounded-3xl" />
          <div className="shimmer h-24 rounded-3xl" />
        </div>
        <div className="shimmer h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div 
      className="delivery-container flex flex-col gap-4 sm:gap-6 !max-w-2xl pb-24"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Driver Status Card */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-500/10 via-white/[0.01] to-emerald-500/[0.02] dark:from-teal-500/10 dark:via-zinc-950/15 dark:to-emerald-500/[0.02] p-6 sm:p-8 border border-slate-200/20 dark:border-white/5 shadow-lg backdrop-blur-xl">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>En Línea</span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-705/80 dark:text-teal-300">Panel Operativo</span>
                <Sparkles className="size-4 text-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1">
                Hola, {firstName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-bold">Resumen de rendimientos y misiones completadas</p>
            </div>
            
            <button 
              onMouseDown={handleSosStart}
              onMouseUp={handleSosEnd}
              onMouseLeave={handleSosEnd}
              onTouchStart={handleSosStart}
              onTouchEnd={handleSosEnd}
              className="size-14 rounded-2xl bg-red-500/10 hover:bg-red-500/15 flex items-center justify-center text-red-500 border border-red-500/20 active:scale-95 transition-all cursor-pointer shadow-lg shadow-red-500/5 animate-pulse select-none touch-none shrink-0"
              title="Presión simple para marcar 128 | Mantener presionado para alerta satelital SOS"
            >
              <Phone className="size-7" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* METRICS GRID */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Earnings today */}
        <div className="rounded-2xl bg-teal-500/5 border border-teal-500/10 p-3.5 text-center shadow-inner relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="absolute top-1 right-1 opacity-5">
            <DollarSign className="size-8 text-teal-500" />
          </div>
          <span className="text-[8px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Hoy</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
            {formatCurrency(stats?.todayEarnings ?? 0)}
          </h4>
          <span className="text-[7.5px] text-slate-450 dark:text-zinc-500 font-extrabold uppercase mt-0.5">Ganancias</span>
        </div>

        {/* Earnings weekly */}
        <div className="rounded-2xl bg-sky-500/5 border border-sky-500/10 p-3.5 text-center shadow-inner relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="absolute top-1 right-1 opacity-5">
            <TrendingUp className="size-8 text-sky-500" />
          </div>
          <span className="text-[8px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Semana</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
            {formatCurrency(stats?.weekEarnings ?? 0)}
          </h4>
          <span className="text-[7.5px] text-slate-450 dark:text-zinc-500 font-extrabold uppercase mt-0.5">Semana móvil</span>
        </div>

        {/* Total Deliveries */}
        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-3.5 text-center shadow-inner relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="absolute top-1 right-1 opacity-5">
            <Truck className="size-8 text-emerald-500" />
          </div>
          <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">Repartos</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
            {stats?.totalDeliveries ?? 0}
          </h4>
          <span className="text-[7.5px] text-slate-450 dark:text-zinc-500 font-extrabold uppercase mt-0.5">Entregados</span>
        </div>

        {/* Rating */}
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-3.5 text-center shadow-inner relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="absolute top-1 right-1 opacity-5">
            <Star className="size-8 text-amber-500" />
          </div>
          <span className="text-[8px] font-black text-amber-600 dark:text-amber-450 uppercase tracking-widest">Valoración</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono flex items-center justify-center gap-0.5 tracking-tight">
            {stats?.rating ?? 5.0}
            <Star className="size-3 text-amber-500 fill-amber-500" />
          </h4>
          <span className="text-[7.5px] text-slate-450 dark:text-zinc-500 font-extrabold uppercase mt-0.5">Puntaje</span>
        </div>
      </motion.div>

      {/* HISTORIAL DE REPARTOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Historial de Repartos</h3>
          <span className="text-[10px] bg-slate-500/5 dark:bg-black/20 border border-slate-200/40 dark:border-white/5 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
            Últimas Entregas
          </span>
        </div>

        {orders.length === 0 ? (
          <GlassCard className="py-20 text-center opacity-60">
            <PackageCheck className="size-12 mx-auto mb-4 text-slate-400 dark:text-zinc-300" />
            <p className="font-medium text-slate-800 dark:text-white">No tienes entregas registradas</p>
            <p className="text-xs text-muted-foreground mt-1">Las entregas que completes aparecerán aquí.</p>
          </GlassCard>
        ) : (
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                variants={fadeUp}
                layout
                className="group"
              >
                <GlassCard 
                  onClick={() => {
                    useAuthStore.getState().navigate('delivery-detail', order.id);
                  }}
                  className="px-3 py-4 sm:p-5 hover:border-teal-500/30 transition-all cursor-pointer no-card-mobile"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2.5">
                      <div className="size-9.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-805 dark:text-zinc-200 truncate max-w-[220px]">
                          {order.delivery_address}
                        </h4>
                        <p className="text-[10px] text-slate-455 dark:text-zinc-500 font-bold mt-0.5">
                          {order.patient?.name || 'Paciente'} • Orden #{order.id.slice(0, 8)}
                        </p>
                        {order.delivered_at && (
                          <span className="text-[8.5px] text-slate-400 dark:text-zinc-550 block mt-1 font-mono">
                            Entregado: {new Date(order.delivered_at).toLocaleDateString()} {new Date(order.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-905 dark:text-white font-mono block">
                        +{formatCurrency((order.pharmacy as any)?.deliveryFee || 29.90)}
                      </span>
                      <span className="text-[7.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        Completado
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons for Invoice */}
                  <div className="flex gap-4 mt-4 pt-3 border-t border-dashed border-slate-200/50 dark:border-white/5 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewInvoice(order);
                      }}
                      disabled={downloadingId === order.id}
                      className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                    >
                      {downloadingId === order.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      Ver Factura
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadInvoice(order);
                      }}
                      disabled={downloadingId === order.id}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                    >
                      {downloadingId === order.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Download className="size-3.5" />
                      )}
                      Descargar PDF
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

       {/* Recent Reviews */}
      <div className="mt-4 bg-white/10 dark:bg-zinc-950/15 border border-slate-200/50 dark:border-white/5 rounded-[2.5rem] p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200/40 dark:border-white/5 pb-2.5">
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-widest">
            <Star className="size-4 text-amber-500 fill-amber-500/10" />
            Calificaciones del Cliente
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Últimas 5</span>
        </div>

        <div className="space-y-3">
          {reviewsLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-550">Cargando reseñas...</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-550 italic">No hay calificaciones aún</div>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-slate-500/[0.02] dark:bg-white/5 space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("size-3", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-zinc-700")} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-105 italic">"{review.comment}"</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SOS satellite emergency dispatch modal overlay */}
      <AnimatePresence>
        {showSosModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden select-none"
            >
              {/* Organic glowing indicator */}
              <div className="absolute -top-12 -left-12 size-36 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <div className="mx-auto size-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-3 animate-pulse">
                  <AlertCircle className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Línea de Auxilio SOS</h3>
                <p className="text-xs text-slate-400 mt-1">Repartidor en Ruta Activa de Medicamentos</p>
              </div>

              <div className="space-y-4">
                {isAuraTriggering ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-teal-500/10 border border-teal-500/30 text-center space-y-4">
                    <div className="relative size-20 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-teal-500/30"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-teal-500/20"
                      />
                      <div className="size-16 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                        {auraCountdown > 0 ? auraCountdown : <Loader2 className="size-8 animate-spin" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-teal-400">Despachando Auxilio Satelital...</h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Compartiendo geolocalización GPS activa y detalles de envío de medicamentos con soporte central.</p>
                    </div>
                    <button
                      type="button"
                      onClick={cancelAuraTrigger}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase tracking-widest text-zinc-300 transition-colors"
                    >
                      Cancelar Alerta
                    </button>
                  </div>
                ) : auraTriggered ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                    <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">¡Auxilio Despachado!</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Tu ubicación y telemetría de vehículo fueron notificadas vía WhatsApp. El centro de soporte Oasis está en camino.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuraTriggered(false);
                        setShowSosModal(false);
                      }}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase tracking-widest text-zinc-300 transition-colors"
                    >
                      Entendido
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startAuraTrigger}
                    className="flex items-center gap-4 w-full p-4 rounded-3xl bg-gradient-to-r from-teal-500/20 via-cyan-500/10 to-transparent border border-teal-500/30 hover:border-teal-500 hover:bg-teal-500/20 text-white transition duration-300 cursor-pointer relative overflow-hidden group shadow-lg shadow-teal-500/5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="size-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 relative z-10 shrink-0 shadow-inner">
                      <Radio className="size-5 animate-pulse" />
                    </div>
                    <div className="text-left flex-1 relative z-10">
                      <div className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        Oasis Aura <span className="text-[7px] bg-teal-400 text-black font-extrabold px-1 rounded">SATELITAL</span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium mt-0.5 leading-tight">Alerta digital vía WhatsApp + Geolocalización Activa</div>
                    </div>
                  </button>
                )}

                <div className="flex gap-2">
                  <a
                    href="tel:128"
                    className="flex-1 flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-white transition duration-200 justify-center text-center"
                  >
                    <div className="text-sm font-black text-white">Cruz Roja (128)</div>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowSosModal(false)}
                    className="flex-1 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-bold transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
