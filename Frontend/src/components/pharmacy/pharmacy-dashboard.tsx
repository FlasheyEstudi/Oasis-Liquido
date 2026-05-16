'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  useInventory,
  useDeliveryOrders,
  usePrescriptions,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatCurrency } from '@/utils/helpers';
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
} from 'lucide-react';
import { QrCode } from '@/components/common/qr-code';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function PharmacyDashboard() {
  const { user, navigate } = useAuthStore();
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

  const inventory = inventoryResult?.data ?? [];
  const deliveryOrders = deliveryResult?.data ?? [];
  const prescriptions = prescriptionsResult?.data ?? [];
  const report = reportResult?.data ?? { todaySalesAmount: 0, inventoryValue: 0, chartData: [] };

  const isLoading = invLoading || delLoading || prescLoading || reportLoading;
  const firstError = invError || delError || prescError;

  const lowStockItems = inventory.filter((item) => item.quantity < 10).length;
  const pendingOrdersCount = deliveryOrders.length;

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
                  value={`pharmacy-id-${pharmacyId}`} 
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

      {/* Pending Orders Count */}
      <motion.div className="col-span-4" variants={fadeUp}>
        <GlassCard hover onClick={() => navigate('gestion-pedidos')}>
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-sky-500/10">
              <ClipboardList className="size-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{pendingOrdersCount}</p>
              <p className="text-xs text-muted-foreground">Pedidos pendientes</p>
            </div>
          </div>
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
    </motion.div>
  );
}
