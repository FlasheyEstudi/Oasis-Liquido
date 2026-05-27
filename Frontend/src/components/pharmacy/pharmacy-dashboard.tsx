'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useInventory,
  useDeliveryOrders,
  usePrescriptions,
  useExpiringBatches,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { PRESCRIPTION_STATUS_CONFIG, DELIVERY_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AnalyticsCard } from '@/components/common/analytics-card';
import { usePharmacyReport } from '@/hooks/use-api';
import {
  Package,
  FileText,
  ClipboardList,
  Warehouse,
  Truck,
  AlertTriangle,
  Activity,
  Pill,
  ShoppingCart,
  Calendar,
  Clock,
} from 'lucide-react';
import { QrCode } from '@/components/common/qr-code';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';




const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function PharmacyDashboard() {
  const { user, navigate, setNotification } = useAuthStore();
  const pharmacyId = 
    user?.pharmacy_manager_profile?.pharmacy_id || 
    (user as any)?.pharmacyManagerProfile?.pharmacyId || 
    'demo-pharmacy-1';

  const pharmacyName = 
    user?.pharmacy_manager_profile?.pharmacy?.name || 
    (user as any)?.pharmacyManagerProfile?.pharmacy?.name || 
    'Farmacia';

  const firstName = user?.name?.split(' ')[0] || 'Farmacéutico';

  const {
    data: inventoryResult,
    isLoading: invLoading,
    error: invError,
    refetch: refetchInv,
  } = useInventory(pharmacyId, { limit: 10 }, !!pharmacyId);

  const {
    data: deliveryResult,
    isLoading: delLoading,
    error: delError,
    refetch: refetchDel,
  } = useDeliveryOrders({ pharmacy_id: pharmacyId, status: 'pending', limit: 10 });

  const {
    data: prescriptionsResult,
    isLoading: prescLoading,
    error: prescError,
    refetch: refetchPresc,
  } = usePrescriptions({ status: 'active', limit: 5 });

  const {
    data: reportResult,
    isLoading: reportLoading,
  } = usePharmacyReport(pharmacyId, 'summary', !!pharmacyId);

  const {
    data: expiringBatchesResult,
    isLoading: expiringLoading,
  } = useExpiringBatches(pharmacyId, !!pharmacyId);

  const {
    data: topProductsResult,
    isLoading: topProductsLoading,
  } = usePharmacyReport(pharmacyId, 'top_products', !!pharmacyId);

  const inventory = inventoryResult?.data ?? [];
  const deliveryOrders = deliveryResult?.data ?? [];
  const prescriptions = prescriptionsResult?.data ?? [];
  const report = reportResult?.data ?? { todaySalesAmount: 0, inventoryValue: 0, chartData: [], deliveryMetrics: { avgDeliveryTime: 35, slaAttainment: 95, activeCount: 0 } };
  const expiringBatches = expiringBatchesResult?.data ?? expiringBatchesResult ?? [];
  const topProducts = topProductsResult?.data ?? topProductsResult ?? [];

  const stockVelocityData = topProducts.map((item: any) => ({
    name: item.medicine?.name?.split(' ')[0] || 'Med',
    fullName: item.medicine?.name || 'Medicamento',
    cantidad: item._sum?.quantity || item.quantity || 0,
  }));

  const isLoading = invLoading || delLoading || prescLoading || reportLoading || expiringLoading || topProductsLoading;
  const firstError = invError || delError || prescError;



  const lowStockItems = inventory.filter((item) => item.quantity < 10).length;
  const pendingOrdersCount = deliveryOrders.length;



  useEffect(() => {
    if (lowStockItems > 0 && !isLoading) {
      setNotification({
        type: 'warning',
        message: `¡Atención! Tienes ${lowStockItems} productos con stock bajo que requieren reabastecimiento.`
      });
    }
  }, [lowStockItems, isLoading, setNotification]);

  if (isLoading) {
    return (
      <div className="bento-grid p-4 md:p-6">
        <div className="col-span-8"><div className="shimmer rounded-3xl h-40" /></div>
        <div className="col-span-4"><div className="shimmer rounded-3xl h-40" /></div>
        <div className="col-span-12"><div className="shimmer rounded-3xl h-28" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
      </div>
    );
  }

  if (firstError) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <Activity className="size-12 text-red-500/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          {getHookErrorMessage(firstError) || 'Error al cargar datos del panel'}
        </p>
        <button
          onClick={() => { refetchInv(); refetchDel(); refetchPresc(); }}
          className="glass-btn-secondary rounded-full px-6 py-2 text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <motion.div className="bento-grid p-4 md:p-6" variants={stagger} initial="initial" animate="animate">
      {/* Revenue Analytics — col-span-8 */}
      <motion.div className="col-span-8" variants={fadeUp}>
        <AnalyticsCard
          title="Ingresos (Últimos 7 días)"
          currentValue={formatCurrency(report.todaySalesAmount)}
          subtitle="Ventas registradas hoy"
          data={report.chartData}
          dataKey="amount"
          xAxisKey="date"
          color="#10b981"
          percentageChange={12}
        />
      </motion.div>

      {/* Low Stock Warning Card — col-span-4 */}
      {lowStockItems > 0 && (
        <motion.div 
          className="col-span-4" 
          variants={fadeUp}
          animate={{ 
            boxShadow: [
              "0 0 0px rgba(239, 68, 68, 0)", 
              "0 0 20px rgba(239, 68, 68, 0.3)", 
              "0 0 0px rgba(239, 68, 68, 0)"
            ] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <GlassCard className="h-full border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-red-500/20 animate-pulse">
                <AlertTriangle className="size-8 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{lowStockItems}</p>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest">Alerta de Stock</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('inventory')}
              className="mt-4 w-full py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
            >
              Revisar Inventario
            </button>
          </GlassCard>
        </motion.div>
      )}

      {/* Inventory Value — col-span-4 (only if no low stock or shared space) */}
      <motion.div className={cn(lowStockItems > 0 ? "col-span-4" : "col-span-4")} variants={fadeUp}>
        <GlassCard className="h-full flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
              <ShoppingCart className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(report.inventoryValue)}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Valor Inventario</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Welcome Card */}
      <motion.div className="col-span-8" variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-foreground"
              >
                {pharmacyName}
              </motion.h1>
              <p className="text-sm text-muted-foreground mt-1">
                Hola, {firstName} — Panel de operaciones
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="size-3.5" />
                  <span>{inventory.length} productos</span>
                </div>
                {lowStockItems > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" />
                    <span>{lowStockItems} stock bajo</span>
                  </div>
                )}
              </div>
            </div>
            <div className="group relative cursor-pointer" onClick={() => navigate('perfil')}>
              <div className="absolute -inset-2 bg-gradient-to-r from-teal-500 to-sky-500 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
              <div className="relative glass-strong rounded-3xl p-2 border border-white/20 shadow-2xl transition-transform group-hover:scale-105">
                <QrCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pasaporte/${user?.id}`} 
                  size={90} 
                  label="FARMACIA ID"
                  className="bg-white rounded-2xl"
                  showValue={false}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Delivery Efficiency KPI Card — col-span-4 */}
      <motion.div className="col-span-4" variants={fadeUp}>
        <GlassCard hover onClick={() => navigate('gestion-pedidos')}>
          <div className="flex flex-col gap-4 justify-between h-full">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10">
                <Truck className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Eficiencia de Delivery</h4>
                <p className="text-xl font-bold text-foreground">SLA: {report.deliveryMetrics?.slaAttainment || 95}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div>
                <p className="text-2xl font-black text-teal-600 dark:text-teal-400">
                  {report.deliveryMetrics?.avgDeliveryTime || 35} <span className="text-xs font-normal">min</span>
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold">Tránsito Promedio</p>
              </div>
              <div>
                <p className="text-2xl font-black text-sky-600 dark:text-sky-400">
                  {report.deliveryMetrics?.activeCount || pendingOrdersCount}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold">Pedidos Activos</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stock Velocity Bar Chart — col-span-12 */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Velocidad de Stock (Rotación de Inventario)</h3>
              <p className="text-xs text-muted-foreground mt-1">Unidades despachadas por medicamento (Top 5 más rotados)</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
              <Activity className="size-3.5" />
              <span>Alta rotación</span>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Package className="size-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">Sin datos de rotación</h3>
              <p className="text-xs text-muted-foreground">Registra ventas en el punto de venta (POS) para comenzar a medir la velocidad.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(156, 163, 175, 0.5)" 
                    fontSize={11}
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(156, 163, 175, 0.5)" 
                    fontSize={11}
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="glass-strong p-3 border border-white/10 rounded-2xl shadow-2xl text-xs">
                            <p className="font-bold text-foreground mb-1">{data.fullName}</p>
                            <p className="text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-widest text-[10px]">
                              Velocidad: {data.cantidad} unidades
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                    {stockVelocityData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill="#8b5cf6" 
                        opacity={0.5 + (index / stockVelocityData.length) * 0.5} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </motion.div>


      {/* Quick Actions */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <GlassCard>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Acciones rápidas</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Warehouse, label: 'Escanear QR', page: 'surtimiento' as const, iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600 dark:text-teal-400', hoverBg: 'hover:bg-teal-500/10 hover:border-teal-500/30' },
              { icon: ShoppingCart, label: 'Punto de Venta', page: 'venta' as const, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400', hoverBg: 'hover:bg-purple-500/10 hover:border-purple-500/30' },
              { icon: Warehouse, label: 'Inventario', page: 'inventario' as const, iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600 dark:text-sky-400', hoverBg: 'hover:bg-sky-500/10 hover:border-sky-500/30' },
              { icon: Truck, label: 'Pedidos', page: 'gestion-pedidos' as const, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400', hoverBg: 'hover:bg-amber-500/10 hover:border-amber-500/30' },
            ].map((action) => (
              <motion.button
                key={action.page}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.page)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl p-4',
                  'glass-input cursor-pointer transition-all duration-200',
                  action.hoverBg,
                )}
              >
                <div className={cn('flex size-11 items-center justify-center rounded-full', action.iconBg)}>
                  <action.icon className={cn('size-5', action.iconColor)} />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Recent Prescriptions */}
      <motion.div className="col-span-6" variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Recetas activas</h3>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('surtimiento')}
              className="text-sm text-teal-600 dark:text-teal-400 font-medium"
            >
              Ver todas
            </motion.button>
          </div>
          {prescriptions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FileText className="size-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
              <p className="text-sm text-muted-foreground">Tu oasis de salud te espera</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
              {prescriptions.slice(0, 5).map((prescription) => {
                const config = PRESCRIPTION_STATUS_CONFIG[prescription.status];
                return (
                  <motion.div
                    key={prescription.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-teal-500/5 transition-colors cursor-pointer"
                    onClick={() => navigate('surtimiento', prescription.id)}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                      <Pill className="size-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {prescription.patient?.name || 'Receta ' + prescription.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {prescription.lines?.length || 0} medicamentos
                      </p>
                    </div>
                    {config && (
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', config.bgColor, config.color)}>
                        {config.label}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Orders Summary */}
      <motion.div className="col-span-6" variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Resumen de pedidos</h3>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('gestion-pedidos')}
              className="text-sm text-teal-600 dark:text-teal-400 font-medium"
            >
              Ver todos
            </motion.button>
          </div>
          {deliveryOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Truck className="size-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Sin datos</h3>
              <p className="text-sm text-muted-foreground">Tu oasis de salud te espera</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
              {deliveryOrders.slice(0, 5).map((order) => {
                const config = DELIVERY_STATUS_CONFIG[order.status];
                return (
                  <motion.div
                    key={order.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-500/5 transition-colors cursor-pointer"
                    onClick={() => navigate('gestion-pedidos', order.id)}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                      <Truck className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {order.patient?.name || 'Pedido ' + order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{order.delivery_address}</p>
                    </div>
                    {config && (
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', config.bgColor, config.color)}>
                        {config.label}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* FEFO Timeline Widget - col-span-12 */}
      <motion.div className="col-span-12" variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-base font-bold text-foreground">Línea de Tiempo FEFO (Vencimientos de Lotes)</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold">
              {expiringBatches.length} lotes activos
            </span>
          </div>

          {expiringBatches.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Calendar className="size-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">Sin vencimientos próximos</h3>
              <p className="text-xs text-muted-foreground">No hay lotes con fecha de vencimiento registrada en los próximos meses.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-white/10 ml-4 pl-6 space-y-6">
              {expiringBatches.map((batch: any, index: number) => {
                const expDate = batch.expirationDate ? new Date(batch.expirationDate) : null;
                const diffTime = expDate ? expDate.getTime() - new Date().getTime() : 0;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let statusColor = "bg-emerald-500 border-emerald-600";
                let badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
                let textLabel = `Expira en ${diffDays} días`;

                if (diffDays <= 0) {
                  statusColor = "bg-rose-600 border-rose-700 animate-pulse";
                  badgeStyle = "bg-rose-500/20 text-rose-500 border border-rose-500/30";
                  textLabel = "¡VENCIDO!";
                } else if (diffDays <= 30) {
                  statusColor = "bg-red-500 border-red-600 animate-pulse";
                  badgeStyle = "bg-red-500/10 text-red-500 border border-red-500/20";
                  textLabel = `Crítico: ${diffDays} días`;
                } else if (diffDays <= 90) {
                  statusColor = "bg-amber-500 border-amber-600";
                  badgeStyle = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                  textLabel = `Próximo: ${diffDays} días`;
                }

                return (
                  <motion.div 
                    key={batch.id || `fefo-${index}`} 
                    className="relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-input hover:border-teal-500/20 transition-all"
                    whileHover={{ x: 6 }}
                  >
                    {/* Timeline bullet indicator */}
                    <span className={cn(
                      "absolute -left-[33px] top-1/2 -translate-y-1/2 size-4 rounded-full border-4 border-slate-950 transition-transform group-hover:scale-125 z-10",
                      statusColor
                    )} />

                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                        <Pill className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {batch.inventory?.medicine?.name || "Medicamento"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lote: <span className="font-mono font-bold text-foreground">{batch.batchNumber}</span> · Stock: <span className="font-semibold text-foreground">{batch.quantity} uds</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider", badgeStyle)}>
                        {textLabel}
                      </span>
                      {batch.expirationDate && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatDate(batch.expirationDate)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

