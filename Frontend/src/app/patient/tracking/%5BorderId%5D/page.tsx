'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRealTimeTracking } from '@/hooks/useRealTimeTracking';
import { RealTimeTrackingMap } from '@/components/delivery/RealTimeTrackingMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { ErrorBlock } from '@/components/common/error-block';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { ArrowLeft, Phone, Truck, Building2, MapPin, Package, Clock, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

export default function PatientTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const { order, driverLocation, route, eta, status, isLoading, isError, refetch } = useRealTimeTracking(orderId);

  // Status timeline nodes for visualization
  const steps = [
    { label: 'Pendiente', desc: 'Pedido recibido en el sistema', active: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'] },
    { label: 'Asignado', desc: 'Repartidor asignado', active: ['assigned', 'picked_up', 'in_transit', 'delivered'] },
    { label: 'Recogido', desc: 'Pedido en manos del repartidor', active: ['picked_up', 'in_transit', 'delivered'] },
    { label: 'En Tránsito', desc: 'Repartidor en camino a tu casa', active: ['in_transit', 'delivered'] },
    { label: 'Entregado', desc: 'Pedido entregado exitosamente', active: ['delivered'] },
  ];

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const states = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'];
    return states.indexOf(order.status);
  }, [order?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
        <LoadingSkeleton type="detail" count={1} />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center justify-center">
        <ErrorBlock 
          message="No se pudo cargar el seguimiento de la orden. Verifica el enlace o vuelve a intentar." 
          onRetry={refetch} 
        />
        <Button 
          onClick={() => router.push('/')} 
          variant="ghost" 
          className="mt-4 text-zinc-400"
        >
          <ArrowLeft className="size-4 mr-2" /> Volver al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-zinc-400">Seguimiento de Envío</h1>
              <p className="text-xs font-mono text-zinc-500">Orden #{order.id?.slice(0, 8)}</p>
            </div>
          </div>
          <StatusBadge status={order.status} type="delivery" />
        </div>
      </header>

      {/* 2. Main content grid */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        
        {/* Real-time OSRM navigation map */}
        <RealTimeTrackingMap orderId={orderId} height="360px" />

        {/* ETA & Status Card */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <Card className="rounded-3xl border-zinc-800/80 bg-zinc-900/40 backdrop-blur shadow-2xl overflow-hidden">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Clock className="size-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400">Tiempo de Entrega Estimado</h3>
                  <p className="text-2xl font-black text-white">{eta}</p>
                </div>
              </div>
              <div className="text-zinc-500 text-xs text-center md:text-right">
                <p>Las actualizaciones son en tiempo real</p>
                <p className="font-mono text-[10px] mt-0.5">Socket ID: Activo</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic status timeline */}
        <Card className="rounded-3xl border-zinc-800/80 bg-zinc-900/30 backdrop-blur">
          <CardContent className="p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-6">Estado del Pedido</h3>
            
            <div className="space-y-6">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                
                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isPassed 
                          ? 'bg-emerald-500 border-emerald-500 text-zinc-950 font-black' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                      }`}>
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 h-10 my-1 ${
                          idx < currentStepIndex ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`} />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${
                        isCurrent ? 'text-white' : isPassed ? 'text-zinc-300' : 'text-zinc-600'
                      }`}>
                        {step.label}
                      </h4>
                      <p className={`text-xs mt-0.5 ${
                        isCurrent ? 'text-zinc-400' : 'text-zinc-500'
                      }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Repartidor Contact details */}
        {order.driver && (
          <Card className="rounded-3xl border-zinc-800/80 bg-zinc-900/30 backdrop-blur overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700/50">
                  <Truck className="size-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{order.driver.name}</h4>
                  <p className="text-xs text-zinc-500">Tu repartidor asignado</p>
                </div>
              </div>
              {order.driver.phone && (
                <a 
                  href={`tel:${order.driver.phone}`} 
                  className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors font-bold shadow-lg shadow-emerald-500/10"
                >
                  <Phone className="size-5 fill-zinc-950" />
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoice breakdown */}
        <Card className="rounded-3xl border-zinc-800/80 bg-zinc-900/20 backdrop-blur">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Package className="size-5 text-emerald-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">Detalles de Compra</h3>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-zinc-200">{item.medicine?.name || 'Medicamento'}</p>
                      <p className="text-zinc-500 font-mono">{item.quantity} un × {formatCurrency(item.unit_price)}</p>
                    </div>
                    <span className="font-bold text-zinc-300">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-zinc-850 pt-3 flex justify-between items-center font-bold text-sm">
                  <span className="text-zinc-400">Monto Total</span>
                  <span className="text-emerald-400">{formatCurrency(
                    order.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0)
                  )}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No hay productos en esta orden.</p>
            )}
          </CardContent>
        </Card>

        {/* Address and pharmacy block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-3xl border-zinc-800/80 bg-zinc-900/10 backdrop-blur p-5 space-y-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <Building2 className="size-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Farmacia de Origen</span>
            </div>
            <p className="text-sm font-black text-white">{order.pharmacy?.name || 'Farmacia'}</p>
            <p className="text-xs text-zinc-500">{order.pharmacy?.address || 'Managua, Nicaragua'}</p>
          </Card>

          <Card className="rounded-3xl border-zinc-800/80 bg-zinc-900/10 backdrop-blur p-5 space-y-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin className="size-4 text-red-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Dirección de Destino</span>
            </div>
            <p className="text-sm font-black text-white">Tu dirección</p>
            <p className="text-xs text-zinc-500 text-ellipsis overflow-hidden">{order.delivery_address}</p>
          </Card>
        </div>

        {/* Trust Badge footer */}
        <div className="flex items-center justify-center gap-2 text-zinc-650 text-[10px] uppercase tracking-widest text-zinc-600 mt-6">
          <ShieldCheck className="size-4" />
          <span>Oasis Nicaragua · Entregas de Confianza</span>
        </div>

      </main>
    </div>
  );
}
