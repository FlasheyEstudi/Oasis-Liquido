'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  useAdminStats,
  useAuditLogs,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatCurrency, timeAgo } from '@/utils/helpers';
import { APPOINTMENT_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Building2,
  Pill,
  Stethoscope,
  Users,
  Calendar,
  DollarSign,
  ArrowRight,
  Activity,
  FileText,
  ClipboardList,
  Shield,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-3xl', className)} />;
}

export function AdminHome() {
  const { user, navigate } = useAuthStore();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAdminStats();

  const { data: logsResult } = useAuditLogs({ limit: 5 });
  const auditLogs = logsResult?.data ?? [];

  if (statsLoading) {
    return (
      <div className="bento-grid">
        <ShimmerBlock className="col-span-8 h-36" />
        <ShimmerBlock className="col-span-4 h-36" />
        <ShimmerBlock className="col-span-6 h-64" />
        <ShimmerBlock className="col-span-6 h-64" />
      </div>
    );
  }

  if (statsError) {
    return (
      <GlassCard className="col-span-12">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <Activity className="size-7 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {getHookErrorMessage(statsError)}
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => refetchStats()}>
            <RefreshCw className="size-4 mr-2" /> Reintentar
          </Button>
        </div>
      </GlassCard>
    );
  }

  const statusData = stats?.appointments_by_status || {};
  const maxStatusValue = Math.max(...(Object.values(statusData) as number[]), 1);

  const statCards = [
    { title: 'Clínicas', value: stats?.total_clinics ?? 0, icon: Building2, bg: 'bg-teal-500/10', color: 'text-teal-600 dark:text-teal-400' },
    { title: 'Farmacias', value: stats?.total_pharmacies ?? 0, icon: Pill, bg: 'bg-sky-500/10', color: 'text-sky-600 dark:text-sky-400' },
    { title: 'Médicos', value: stats?.total_doctors ?? 0, icon: Stethoscope, bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Pacientes', value: stats?.total_patients ?? 0, icon: Users, bg: 'bg-violet-500/10', color: 'text-violet-600 dark:text-violet-400' },
    { title: 'Citas', value: stats?.total_appointments ?? 0, icon: Calendar, bg: 'bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
    { title: 'Ingresos', value: formatCurrency(stats?.monthly_revenue ?? 0), icon: DollarSign, bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="bento-grid">
      {/* Welcome Card - col-span-8 */}
      <GlassCard className="col-span-12 lg:col-span-8">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold"
            >
              Panel de administración
            </motion.h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenido, {user?.name || 'Admin'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="group relative cursor-pointer" onClick={() => navigate('perfil')}>
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-teal-500/20 rounded-[2rem] opacity-0 blur-xl group-hover:opacity-100 transition-opacity" />
              <div className="relative glass-strong rounded-2xl p-1.5 border border-white/20 shadow-xl transition-transform group-hover:scale-105">
                <div className="flex size-14 items-center justify-center rounded-xl bg-amber-500/10">
                  <Shield className="size-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Mini Card - col-span-4 */}
      <GlassCard className="col-span-12 lg:col-span-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="size-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-semibold">Resumen</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-teal-500/8 dark:bg-teal-500/10 p-3 text-center">
            <p className="text-lg font-bold">{stats?.total_appointments ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Citas</p>
          </div>
          <div className="rounded-2xl bg-sky-500/8 dark:bg-sky-500/10 p-3 text-center">
            <p className="text-lg font-bold">{stats?.total_prescriptions ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Recetas</p>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="col-span-4 sm:col-span-6 lg:col-span-4"
        >
          <GlassCard className="!p-4">
            <div className="flex items-center gap-3">
              <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', stat.bg)}>
                <stat.icon className={cn('size-5', stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold truncate">{stat.value}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}

      {/* Appointments by Status Chart */}
      <GlassCard className="col-span-12 md:col-span-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="size-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-semibold">Citas por estado</h3>
        </div>
        {Object.keys(statusData).length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <BarChart3 className="size-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Sin datos de citas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(statusData).map(([status, count]) => {
              const config = APPOINTMENT_STATUS_CONFIG[status];
              const percentage = ((count as number) / maxStatusValue) * 100;
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{config?.label || status}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        status === 'completed' && 'bg-emerald-500',
                        status === 'scheduled' && 'bg-sky-500',
                        status === 'confirmed' && 'bg-teal-500',
                        status === 'in_progress' && 'bg-amber-500',
                        status === 'cancelled' && 'bg-red-500',
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Clinics - col-span-6 */}
      <GlassCard className="col-span-12 md:col-span-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="size-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold">Acciones rápidas</h3>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Gestionar Clínicas', icon: Building2, color: 'text-teal-600 dark:text-teal-400', page: 'gestionar-clinicas' as const },
            { label: 'Gestionar Farmacias', icon: Pill, color: 'text-sky-600 dark:text-sky-400', page: 'gestionar-farmacias' as const },
            { label: 'Gestionar Usuarios', icon: Users, color: 'text-violet-600 dark:text-violet-400', page: 'gestionar-usuarios' as const },
            { label: 'Ver Auditoría', icon: FileText, color: 'text-amber-600 dark:text-amber-400', page: 'auditoria' as const },
          ].map((action) => (
            <motion.button
              key={action.page}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.page)}
              className="flex items-center justify-between w-full rounded-2xl p-3 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <action.icon className={cn('size-4', action.color)} />
                <span className="text-sm font-medium">{action.label}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground/40" />
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Recent Activity */}
      {auditLogs.length > 0 && (
        <GlassCard className="col-span-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold">Actividad reciente</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-teal-600 dark:text-teal-400 rounded-full text-xs" onClick={() => navigate('auditoria')}>
              Ver todo <ArrowRight className="size-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-2xl p-3 hover:bg-muted/30 transition-colors">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {log.user_name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{log.user_name}</span>{' '}
                    <span className="text-muted-foreground">
                      {log.action === 'CREATE' ? 'creó' : log.action === 'UPDATE' ? 'actualizó' : log.action === 'DELETE' ? 'eliminó' : log.action.toLowerCase()}
                    </span>{' '}
                    <span className="rounded-lg bg-muted px-1.5 py-0.5 text-[10px] font-medium">{log.resource_type}</span>
                  </p>
                  {log.details && <p className="mt-0.5 truncate text-xs text-muted-foreground">{log.details}</p>}
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">{timeAgo(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
