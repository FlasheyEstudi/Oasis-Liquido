'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { 
  useDeliveryOrders, 
  useUpdateDeliveryStatus, 
  useReviews,
  getHookErrorMessage 
} from '@/hooks/use-api';
import { timeAgo } from '@/utils/helpers';
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
  Loader2
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

  const {
    data: ordersResult,
    isLoading,
    error,
    refetch,
  } = useDeliveryOrders({ status: 'pending', limit: 20 });

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

  if (isLoading) {
    return (
      <div className="delivery-container space-y-4 !max-w-2xl">
        <div className="shimmer h-32 rounded-3xl" />
        <div className="shimmer h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div 
      className="delivery-container flex flex-col gap-4 sm:gap-6 !max-w-2xl"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Driver Status Card */}
      <motion.div variants={fadeUp}>
        <GlassCard className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden transition-colors duration-300 px-3 py-4 sm:p-6 no-card-mobile">
          <div className="absolute top-0 right-0 p-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              <div className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse" />
              En Línea
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Hola, {firstName}</h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mt-1">Tu oasis de hoy: <span className="text-teal-600 dark:text-teal-400">{orders.length} entregas</span></p>
            </div>
            <button 
              onMouseDown={handleSosStart}
              onMouseUp={handleSosEnd}
              onMouseLeave={handleSosEnd}
              onTouchStart={handleSosStart}
              onTouchEnd={handleSosEnd}
              className="size-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500 border border-red-500/30 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-red-500/10 animate-pulse select-none touch-none"
              title="Presión simple para marcar 128 | Mantener presionado para alerta satelital SOS"
            >
              <Phone className="size-7" />
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Active Deliveries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Ruta Actual</h3>
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
            En Tiempo Real
          </span>
        </div>

        {orders.length === 0 ? (
          <GlassCard className="py-20 text-center opacity-60">
            <PackageCheck className="size-12 mx-auto mb-4 text-slate-400 dark:text-zinc-300" />
            <p className="font-medium text-slate-800 dark:text-white">No hay entregas pendientes</p>
            <p className="text-xs text-muted-foreground mt-1">¡Buen trabajo! Disfruta tu descanso.</p>
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
                <GlassCard className="px-3 py-4 sm:p-6 hover:border-teal-500/30 transition-all cursor-pointer no-card-mobile">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="size-10 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-teal-600">
                        <MapPin className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground truncate max-w-[180px]">
                          {order.delivery_address}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {order.patient?.name || 'Cliente Oasis'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} type="delivery" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        <Clock className="size-3" />
                        <span>Espera</span>
                      </div>
                      <p className="text-sm font-bold">12 min</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        <MapIcon className="size-3" />
                        <span>Distancia</span>
                      </div>
                      <p className="text-sm font-bold">1.4 km</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.open(`tel:${order.patient?.phone}`)}
                      className="flex-1 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-zinc-600 hover:bg-muted transition-colors"
                    >
                      <Phone className="size-5" />
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(order.id, 'picked_up')}
                      className="flex-[3] h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 shadow-xl"
                      disabled={updatingId === order.id}
                    >
                      <Navigation className="size-4" />
                      Iniciar Entrega
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Recent Reviews */}
      <GlassCard className="mt-4 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 transition-colors duration-300 px-3 py-4 sm:p-6 no-card-mobile">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-widest">
            <Star className="size-4 text-amber-500" />
            Calificaciones del Cliente
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold">Últimas 5</span>
        </div>

        <div className="space-y-3">
          {reviewsLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-500">Cargando reseñas...</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-500 italic">No hay calificaciones aún</div>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-white/5 space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("size-3", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-zinc-700")} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 italic">"{review.comment}"</p>
              </div>
            ))
          )}
        </div>
      </GlassCard>

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
