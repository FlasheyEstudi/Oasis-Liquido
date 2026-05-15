'use client';

import { useAuthStore } from '@/store/auth-store';
import { useAdminStats, useAuditLogs, useReviews, getHookErrorMessage } from '@/hooks/use-api';
import { formatCurrency, timeAgo } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { ErrorBlock } from '@/components/common/error-block';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APPOINTMENT_STATUS_CONFIG } from '@/utils/constants';
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
  Star,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const { user, navigate } = useAuthStore();

  // React Query hooks
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats();
  const { data: auditData, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useAuditLogs({ limit: 5 });
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews({ limit: 10 });

  const isLoading = statsLoading || logsLoading;
  const error = statsError || logsError;

  const reviews = reviewsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="space-y-1">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 animate-pulse rounded bg-gray-100" />
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingSkeleton type="list" count={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorBlock message={getHookErrorMessage(error) || 'No se pudieron cargar las estadísticas'} onRetry={() => { refetchStats(); refetchLogs(); }} />;
  }

  const auditLogs = auditData?.data ?? [];
  const statusData = (stats?.appointments_by_status || {}) as Record<string, number>;
  const maxStatusValue = Math.max(...Object.values(statusData), 1);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          Panel de administración
        </h1>
        <p className="text-sm text-gray-500">
          Bienvenido, {user?.name || 'Administrador'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Clínicas"
          value={stats?.total_clinics ?? 0}
          icon={<Building2 className="size-6" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Total Farmacias"
          value={stats?.total_pharmacies ?? 0}
          icon={<Pill className="size-6" />}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="Total Médicos"
          value={stats?.total_doctors ?? 0}
          icon={<Stethoscope className="size-6" />}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <StatCard
          title="Total Pacientes"
          value={stats?.total_patients ?? 0}
          icon={<Users className="size-6" />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          title="Total Citas"
          value={stats?.total_appointments ?? 0}
          icon={<Calendar className="size-6" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Ingresos mensuales"
          value={formatCurrency(stats?.monthly_revenue ?? 0)}
          icon={<DollarSign className="size-6" />}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Appointments by Status Chart + Quick Links */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="size-4" />
              Citas por estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusData).map(([status, count]) => {
              const config = APPOINTMENT_STATUS_CONFIG[status];
              const percentage = (count / maxStatusValue) * 100;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {config?.label || status}
                    </span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'completed'
                          ? 'bg-green-500'
                          : status === 'scheduled'
                          ? 'bg-blue-500'
                          : status === 'confirmed'
                          ? 'bg-cyan-500'
                          : status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-500">
                <Star className="size-4 text-amber-500" />
                Reseñas recientes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {reviewsLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Cargando reseñas...</div>
              ) : reviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No hay reseñas aún</div>
              ) : (
                reviews.map((review: any) => (
                  <div key={review.id} className="p-3 rounded-xl border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={cn("size-3", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{review.targetType}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(review.createdAt)}</span>
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-2">{review.comment}</p>
                    <p className="text-[10px] text-muted-foreground">Por: <span className="text-foreground">{review.user?.name}</span></p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      {auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="size-4" />
                Actividad reciente
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600"
                onClick={() => navigate('audit-logs')}
              >
                Ver todo
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border bg-gray-50 p-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                    {log.user_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.user_name}</span>{' '}
                      <span className="text-gray-500">
                        {log.action === 'CREATE'
                          ? 'creó'
                          : log.action === 'UPDATE'
                          ? 'actualizó'
                          : log.action === 'DELETE'
                          ? 'eliminó'
                          : log.action.toLowerCase()}
                      </span>{' '}
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                        {log.resource_type}
                      </span>
                    </p>
                    {log.details && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {log.details}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {timeAgo(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
