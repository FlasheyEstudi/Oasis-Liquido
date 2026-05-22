'use client';

import React, { useState } from 'react';
import { useBetaFeedbacks, useUpdateBetaFeedbackStatus } from '@/hooks/use-api';
import { MessageSquare, AlertCircle, CheckCircle, Eye, EyeOff, Sparkles, Filter, Check, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ManageFeedback() {
  const [activeTab, setActiveTab] = useState<'all' | 'bug' | 'suggestion' | 'general'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'ignored'>('all');

  const { data: feedbacks, isLoading, error } = useBetaFeedbacks();
  const { mutateAsync: updateStatus } = useUpdateBetaFeedbackStatus();

  const handleUpdateStatus = async (id: string, status: 'resolved' | 'ignored') => {
    try {
      await updateStatus({ id, status });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filtered = feedbacks
    ? feedbacks.filter((item: any) => {
        const matchesTab = activeTab === 'all' ? true : item.type === activeTab;
        const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        return matchesTab && matchesStatus;
      })
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="size-7 text-teal-500 animate-pulse" /> Feedback y Reportes de la Beta
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administra sugerencias, reporte de fallas y comentarios enviados en caliente por los usuarios de Oasis.
          </p>
        </div>

        {/* Aggregate Stats */}
        {feedbacks && (
          <div className="flex gap-3 text-[11px] font-bold">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300">
              🐛 Bugs: {feedbacks.filter((f: any) => f.type === 'bug').length}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-300">
              💡 Ideas: {feedbacks.filter((f: any) => f.type === 'suggestion').length}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-350">
              Total: {feedbacks.length}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/60 dark:bg-slate-900/40 p-3 rounded-[24px] border border-slate-200/50 dark:border-teal-500/10 glass">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'bug', 'suggestion', 'general'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${
                activeTab === tab
                  ? 'bg-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.25)]'
                  : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              {tab === 'all' ? 'Todos' : tab === 'bug' ? '🐛 Bugs' : tab === 'suggestion' ? '💡 Ideas' : '💬 General'}
            </button>
          ))}
        </div>

        {/* Status Dropdown/Selector */}
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500/50 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Cualquier Estado</option>
            <option value="pending">Pendientes</option>
            <option value="resolved">Resueltos</option>
            <option value="ignored">Ignorados</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 rounded-[24px] bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-rose-500/5 border border-rose-500/10 rounded-[32px] p-6 max-w-md mx-auto">
          <ShieldAlert className="size-12 text-rose-500 mx-auto animate-bounce mb-3" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Error de Conexión</h3>
          <p className="text-xs text-slate-500 mt-1">No se pudieron cargar los comentarios de los usuarios en vivo.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/40 rounded-[32px] p-8 max-w-lg mx-auto glass">
          <Sparkles className="size-12 text-teal-400/80 mx-auto animate-pulse mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Bandeja de Entrada Limpia</h3>
          <p className="text-xs text-slate-500 mt-1">No hay reportes ni sugerencias beta en esta categoría por el momento.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((item: any) => {
              const typeColors =
                item.type === 'bug'
                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
                  : item.type === 'suggestion'
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                  : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400';

              const statusBadge =
                item.status === 'resolved'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : item.status === 'ignored'
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  : 'bg-teal-500/10 text-teal-600 dark:text-teal-400';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden flex flex-col justify-between h-56 group hover:shadow-lg transition-all"
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${typeColors}`}>
                        {item.type === 'bug' ? '🐛 Bug' : item.type === 'suggestion' ? '💡 Idea' : '💬 Gral'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadge}`}>
                        {item.status === 'resolved' ? 'Resuelto' : item.status === 'ignored' ? 'Ignorado' : 'Pendiente'}
                      </span>
                    </div>

                    {/* Content text */}
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-350 line-clamp-3 font-medium">
                      "{item.content}"
                    </p>
                  </div>

                  {/* Footer / Meta info */}
                  <div className="pt-4 border-t border-slate-150/40 dark:border-slate-800/40 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                        {item.user?.name || 'Usuario Anónimo'}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">
                        {item.user?.email || 'Nicaragua Beta'} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action controls */}
                    {item.status === 'pending' && (
                      <div className="flex gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateStatus(item.id, 'resolved')}
                          title="Marcar como resuelto"
                          className="size-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-500/20 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Check className="size-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateStatus(item.id, 'ignored')}
                          title="Ignorar o archivar"
                          className="size-7 rounded-lg bg-slate-100 hover:bg-slate-500 text-slate-500 hover:text-white border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <EyeOff className="size-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
