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
  const [userQuery, setUserQuery] = useState('');
  const [ipQuery, setIpQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
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

  const filteredLogs = allLogs.filter((log) => {
    // User search (matches name or ID)
    if (userQuery.trim() !== '') {
      const uQuery = userQuery.toLowerCase();
      const matchesName = log.user_name?.toLowerCase().includes(uQuery);
      const matchesId = log.user_id?.toLowerCase().includes(uQuery);
      if (!matchesName && !matchesId) return false;
    }

    // IP search
    if (ipQuery.trim() !== '') {
      const ipVal = ((log as any).ipAddress || (log as any).ip_address || '').toLowerCase();
      if (!ipVal.includes(ipQuery.toLowerCase())) return false;
    }

    // Resource selection
    if (resourceFilter !== 'all') {
      if (log.resource_type !== resourceFilter && (log as any).entityType !== resourceFilter) return false;
    }

    return true;
  });

  const hasActiveFilters = actionFilter !== 'all' || dateFrom !== '' || dateTo !== '' || userQuery !== '' || ipQuery !== '' || resourceFilter !== 'all';

  const clearFilters = () => {
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setUserQuery('');
    setIpQuery('');
    setResourceFilter('all');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (allLogs.length === 0) {
      alert('No hay registros para exportar');
      return;
    }
    
    const headers = ['ID', 'Usuario', 'Accion', 'Recurso', 'Detalles', 'IP Address', 'Fecha'];
    const rows = allLogs.map((log) => [
      log.id,
      log.user_name || 'Sistema',
      ACTION_LABELS[log.action] || log.action,
      RESOURCE_LABELS[log.resource_type] || log.resource_type || (log as any).entityType || '',
      log.details || '',
      (log as any).ipAddress || (log as any).ip_address || 'N/A',
      formatDateTime(log.created_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCSV}
            className="h-10 px-5 rounded-[12px_36px_12px_36px] flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:border-amber-500/35 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_12px_rgba(245,158,11,0.1)] transition-all duration-300 cursor-pointer font-bold text-xs uppercase tracking-wider"
          >
            <FileText className="size-4" />
            Exportar CSV
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters((prev) => !prev)}
            className={cn(
              'h-10 px-5 flex items-center gap-2 transition-all duration-300 cursor-pointer font-bold text-xs uppercase tracking-wider',
              showFilters || hasActiveFilters
                ? 'rounded-[36px_12px_36px_12px] bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_4px_12px_rgba(20,184,166,0.15)]'
                : 'rounded-[36px_12px_36px_12px] bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-800',
            )}
          >
            <Filter className="size-4" />
            Filtros
            {hasActiveFilters && (
              <span className="flex size-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-md">
                {(actionFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (userQuery ? 1 : 0) + (ipQuery ? 1 : 0) + (resourceFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </motion.button>
        </div>
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

              {/* Row 2: Advanced Search Filters */}
              <div className="grid gap-4 sm:grid-cols-3 mt-4 pt-4 border-t border-border/30">
                {/* User query */}
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Usuario (ID o Nombre)</label>
                  <Input
                    placeholder="Buscar por nombre o ID..."
                    value={userQuery}
                    onChange={(e) => { setUserQuery(e.target.value); setPage(1); }}
                    className="glass-input rounded-xl px-3 py-2 h-10 text-xs w-full"
                  />
                </div>

                {/* IP address query */}
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Dirección IP</label>
                  <Input
                    placeholder="Filtrar por IP (ej. 192.168.1.1)..."
                    value={ipQuery}
                    onChange={(e) => { setIpQuery(e.target.value); setPage(1); }}
                    className="glass-input rounded-xl px-3 py-2 h-10 text-xs w-full"
                  />
                </div>

                {/* Entity / Resource filter */}
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Recurso / Entidad</label>
                  <select
                    value={resourceFilter}
                    onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
                    className="glass-input rounded-xl px-3 py-2 h-10 text-xs w-full bg-background border border-border/50 text-foreground font-medium outline-none cursor-pointer"
                  >
                    <option value="all">Todos los recursos</option>
                    {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Log Details Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col glass-strong rounded-[2.5rem] border border-white/20 shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white">Detalles del Registro</h3>
                  <p className="text-xs text-white/50 font-mono mt-1">ID: {selectedLog.id}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedLog(null)}
                  className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="size-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-500">Acción</p>
                    <p className="text-sm font-semibold text-white">{ACTION_LABELS[selectedLog.action] || selectedLog.action}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Recurso</p>
                    <p className="text-sm font-semibold text-white">{RESOURCE_LABELS[selectedLog.resource_type] || selectedLog.resource_type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Usuario</p>
                    <p className="text-sm font-semibold text-white">{selectedLog.user_name || 'Sistema'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">Fecha</p>
                    <p className="text-sm font-semibold text-white">{formatDateTime(selectedLog.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Datos Cambiados (JSON)</p>
                  <pre className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.details || '{}');
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        return selectedLog.details || 'Sin detalles adicionales';
                      }
                    })()}
                  </pre>
                </div>

                {(selectedLog.ip_address || selectedLog.user_agent) && (
                  <div className="pt-4 border-t border-white/10 grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Activity className="size-3" />
                      <span>IP: {selectedLog.ip_address || 'N/A'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] text-white/30 font-mono">
                      <span className="shrink-0">User Agent:</span>
                      <span className="break-all">{selectedLog.user_agent || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end bg-white/5">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLog(null)}
                  className="h-10 px-8 rounded-[12px_36px_12px_36px] bg-gradient-to-r from-teal-500 via-teal-450 to-cyan-555 hover:from-teal-600 hover:to-cyan-650 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[inset_0_3px_6px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_20px_rgba(20,184,166,0.2)] border-none transition-all duration-300 cursor-pointer"
                >
                  Cerrar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logs Table */}
      <AnimatePresence mode="wait">
        {filteredLogs.length === 0 ? (
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
                  {filteredLogs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-border/30 hover:bg-teal-500/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
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
