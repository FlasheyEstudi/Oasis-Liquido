'use client';

import { useState } from 'react';
import { useAuditLogs, getHookErrorMessage } from '@/hooks/use-api';
import { formatDateTime, timeAgo } from '@/utils/helpers';
import { GlassCard } from '@/components/oasis/glass-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  UPDATE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  LOGIN: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  LOGOUT: 'bg-muted text-muted-foreground border-border/50',
};

const RESOURCE_LABELS: Record<string, string> = {
  clinic: 'Clínica',
  pharmacy: 'Farmacia',
  user: 'Usuario',
  appointment: 'Cita',
  prescription: 'Receta',
  delivery_order: 'Orden de entrega',
  sale: 'Venta',
  inventory: 'Inventario',
};

export function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 10;

  const {
    data: logsResult,
    isLoading,
    error,
    refetch,
  } = useAuditLogs({
    page,
    limit,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    date_from: dateFrom || undefined,
  });

  const allLogs = logsResult?.data ?? [];
  const totalPages = logsResult?.pagination?.totalPages ?? 1;

  const hasActiveFilters = actionFilter !== 'all' || dateFrom !== '' || dateTo !== '';

  const clearFilters = () => {
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="glass rounded-3xl p-6">
          <div className="shimmer rounded-2xl h-10 w-64 mb-4" />
          <div className="shimmer rounded-2xl h-64" />
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <Activity className="size-12 text-red-500/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          {getHookErrorMessage(error) || 'No se pudieron cargar los logs de auditoría'}
        </p>
        <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Logs de Auditoría</h1>
          <p className="text-sm text-muted-foreground">Registro de actividad del sistema</p>
        </motion.div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters((prev) => !prev)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all',
            showFilters || hasActiveFilters
              ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
              : 'glass-btn-secondary',
          )}
        >
          <Filter className="size-4" />
          Filtros
          {hasActiveFilters && (
            <span className="flex size-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
              {(actionFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
            </span>
          )}
        </motion.button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <GlassCard>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* Action Filter */}
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Acción</label>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setActionFilter('all'); setPage(1); }}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-all',
                        actionFilter === 'all'
                          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                          : 'glass-input hover:bg-teal-500/5',
                      )}
                    >
                      Todas
                    </motion.button>
                    {Object.entries(ACTION_LABELS).map(([key, label]) => (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setActionFilter(key); setPage(1); }}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-all',
                          actionFilter === key
                            ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                            : 'glass-input hover:bg-teal-500/5',
                        )}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Date Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> Desde
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                      className="glass-input rounded-xl px-3 py-2 h-auto text-sm w-full sm:w-auto"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> Hasta
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                      className="glass-input rounded-xl px-3 py-2 h-auto text-sm w-full sm:w-auto"
                    />
                  </div>
                  {hasActiveFilters && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={clearFilters}
                      className="glass-btn-secondary rounded-full px-3 py-2 text-xs font-medium flex items-center gap-1.5"
                    >
                      <X className="size-3" />
                      Limpiar
                    </motion.button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Table */}
      <AnimatePresence mode="wait">
        {allLogs.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center py-12 text-center"
          >
            <FileText className="size-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Sin registros</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron logs de auditoría con los filtros aplicados
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="!p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Usuario</TableHead>
                    <TableHead className="text-muted-foreground">Acción</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Recurso</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Detalles</TableHead>
                    <TableHead className="text-muted-foreground hidden lg:table-cell">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLogs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-border/30 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-semibold text-teal-600 dark:text-teal-400">
                            {log.user_name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-foreground text-sm">{log.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium border',
                            ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground border-border/50',
                          )}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                          {log.details || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {timeAgo(log.created_at)}
                          </span>
                          <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                            <Activity className="size-3" />
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full"
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full"
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
