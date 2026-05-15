'use client';

import { useState } from 'react';
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
  Star
} from 'lucide-react';
import { toast } from 'sonner';

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
      <div className="p-4 space-y-4">
        <div className="shimmer h-32 rounded-3xl" />
        <div className="shimmer h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Driver Status Card */}
      <motion.div variants={fadeUp}>
        <GlassCard className="bg-zinc-900 border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En Línea
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Hola, {firstName}</h1>
              <p className="text-zinc-400 text-sm font-medium mt-1">Tu oasis de hoy: <span className="text-teal-400">{orders.length} entregas</span></p>
            </div>
            <button className="size-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30 active:scale-95 transition-transform">
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
            <PackageCheck className="size-12 mx-auto mb-4 text-zinc-300" />
            <p className="font-medium">No hay entregas pendientes</p>
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
                <GlassCard className="p-5 hover:border-teal-500/30 transition-all cursor-pointer">
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
      <GlassCard className="mt-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 uppercase tracking-widest">
            <Star className="size-4 text-amber-500" />
            Calificaciones del Cliente
          </h3>
          <span className="text-[10px] text-zinc-500 font-bold">Últimas 5</span>
        </div>

        <div className="space-y-3">
          {reviewsLoading ? (
            <div className="py-8 text-center text-xs text-zinc-500">Cargando reseñas...</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 italic">No hay calificaciones aún</div>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="p-4 rounded-2xl border border-zinc-800 bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("size-3", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700")} />
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-500">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-xs font-bold text-zinc-100 italic">"{review.comment}"</p>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
