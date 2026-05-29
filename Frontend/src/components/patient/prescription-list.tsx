'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  usePrescriptions,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { Prescription, PrescriptionStatus } from '@/types';
import { formatDate, getInitials } from '@/utils/helpers';
import { PRESCRIPTION_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QrCode } from '@/components/common/qr-code';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  QrCode as QrCodeIcon,
  Pill,
  Calendar,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Shield,
} from 'lucide-react';

const FILTER_TABS: { value: string; label: string; status?: PrescriptionStatus }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'partially_fulfilled', label: 'Parciales' },
  { value: 'fulfilled', label: 'Surtidas' },
  { value: 'expired', label: 'Expiradas' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PrescriptionList() {
  const { navigate } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [qrDialog, setQrDialog] = useState<Prescription | null>(null);

  const params = activeTab !== 'all' ? { status: activeTab as PrescriptionStatus } : undefined;
  const prescriptionsQuery = usePrescriptions(params);
  const prescriptions = prescriptionsQuery.data?.data ?? [];

  const isActive = (status: PrescriptionStatus) =>
    status === 'active' || status === 'partially_fulfilled';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2.5 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="size-5.5 text-indigo-500 animate-pulse" />
            <span>Mis Recetas Digitales</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-455 font-semibold mt-0.5">
            Validadas por el MINSA y listas para surtido en farmacias autorizadas
          </p>
        </div>

        <Button
          onClick={() => navigate('pharmacy-map')}
          className="w-full sm:w-auto h-11 px-5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 transition-all duration-300"
        >
          <Search className="size-4" />
          Buscar farmacias con stock
        </Button>
      </div>

      {/* Filter Tabs — Sliding glass bar */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 bg-slate-500/[0.03] dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 p-1 rounded-2xl w-max sm:w-full">
          {FILTER_TABS.map((tab) => {
            const isTabActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 select-none flex-1 text-center min-w-[100px] sm:min-w-0',
                  isTabActive
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10 border border-indigo-600/10'
                    : 'text-slate-550 dark:text-zinc-400 hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Stepper */}
      <AnimatePresence mode="wait">
        {prescriptionsQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" key="loading">
            {[1, 2, 3].map((n) => (
              <div key={n} className="shimmer rounded-[2rem] h-48 border border-slate-200/30 dark:border-white/5 opacity-70" />
            ))}
          </div>
        ) : prescriptionsQuery.isError ? (
          <motion.div key="error" {...fadeInUp}>
            <GlassCard className="border border-slate-200 dark:border-white/5">
              <div className="flex flex-col items-center py-10 text-center space-y-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md">
                  <AlertCircle className="size-6 text-red-500 animate-bounce" />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-450">
                  {getHookErrorMessage(prescriptionsQuery.error)}
                </p>
                <Button
                  className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs px-6"
                  onClick={() => prescriptionsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ) : prescriptions.length === 0 ? (
          <motion.div key="empty" {...fadeInUp}>
            <GlassCard className="border border-slate-200 dark:border-white/5 bg-slate-500/[0.01] dark:bg-zinc-950/20">
              <div className="flex flex-col items-center py-14 text-center max-w-sm mx-auto space-y-4.5">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center">
                  <FileText className="size-7 text-slate-400 dark:text-zinc-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white">Sin Recetas</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-450 font-semibold leading-relaxed">
                    No tienes recetas médicas emitidas registradas en esta sección en este momento.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {prescriptions.map((presc, index) => {
              const medCount = presc.lines?.length || 0;
              const statusConfig = PRESCRIPTION_STATUS_CONFIG[presc.status];
              return (
                <motion.div
                  key={presc.id}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.03 }}
                >
                  <GlassCard
                    hover
                    className="!p-5 border border-slate-250 dark:border-white/5 bg-white dark:bg-zinc-950/20 shadow-xl hover:shadow-2xl transition-all duration-300 relative flex flex-col justify-between h-full rounded-[2.25rem]"
                    onClick={() => {
                      useAuthStore.getState().setPrescriptionId(presc.id);
                      navigate('prescription-detail', presc.id);
                    }}
                  >
                    <div className="space-y-4">
                      {/* Doctor Profile Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-11 border border-teal-500/10 shrink-0">
                            <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-black">
                              {presc.doctor ? getInitials(presc.doctor.name) : 'DR'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                              {presc.doctor?.name || 'Médico'}
                            </p>
                            {presc.doctor?.doctor_profile?.specialty && (
                              <p className="text-[10px] font-black text-teal-650 dark:text-teal-400 uppercase tracking-widest mt-0.5 truncate">
                                {presc.doctor.doctor_profile.specialty}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 border',
                          statusConfig?.bgColor,
                          statusConfig?.color
                        )}>
                          {statusConfig?.label || presc.status}
                        </span>
                      </div>

                      {/* Ticket Dotted Tear Line */}
                      <div className="border-t border-dashed border-slate-200 dark:border-white/10 my-1" />

                      {/* Ticket details */}
                      <div className="space-y-2 bg-slate-500/[0.02] dark:bg-zinc-950/20 border border-slate-200 dark:border-white/5 rounded-2xl p-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-650 dark:text-zinc-350">
                          <Calendar className="size-3.5 text-indigo-500 shrink-0" />
                          <span>Emitida: {formatDate(presc.issue_date, 'dd MMM yyyy')}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-zinc-400 truncate">
                          <Pill className="size-3.5 text-teal-500 shrink-0" />
                          <span>{medCount} medicamento{medCount !== 1 ? 's' : ''} prescripto{medCount !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Expiration context */}
                        {presc.status === 'active' && presc.expiration_date && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200/50 dark:border-white/5">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Vence: {formatDate(presc.expiration_date, 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary Actions Row */}
                    <div className="mt-4 pt-3 border-t border-slate-250/20 dark:border-white/5 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      {isActive(presc.status) ? (
                        <button
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-teal-500 hover:bg-teal-600 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-teal-500/10 transition-all duration-300 select-none z-10"
                          onClick={() => {
                            useAuthStore.getState().setPrescriptionId(presc.id);
                            navigate('pharmacy-map', presc.id);
                          }}
                        >
                          <Search className="size-3" />
                          Surtir Receta
                        </button>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550 flex items-center gap-1 hover:text-indigo-500" onClick={() => {
                          useAuthStore.getState().setPrescriptionId(presc.id);
                          navigate('prescription-detail', presc.id);
                        }}>
                          Ver Detalles
                          <ChevronRight className="size-3.5" />
                        </span>
                      )}

                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200 dark:border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-zinc-350 transition-all duration-300 select-none z-10"
                        onClick={() => setQrDialog(presc)}
                      >
                        <QrCodeIcon className="size-3.5 text-indigo-500" />
                        QR
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secure QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={(open) => !open && setQrDialog(null)}>
        <DialogContent className="rounded-[2.25rem] glass-strong border-slate-200 dark:border-white/10 max-w-sm mx-auto p-6 text-center">
          <DialogHeader className="items-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="size-5 text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">Verificación de Receta</span>
            </div>
            <DialogTitle className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-white">Código QR Seguro</DialogTitle>
          </DialogHeader>

          {qrDialog && (
            <div className="flex flex-col items-center py-2 space-y-4">
              <div className="flex justify-center bg-slate-100 dark:bg-white rounded-[2rem] p-4 border border-slate-250/50 shadow-inner w-fit">
                <QrCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/family/verify#prescription-${qrDialog.id}`} 
                  size={160} 
                  label="Receta Médica"
                  className="scale-95"
                  showValue={false}
                />
              </div>

              <div className="w-full space-y-1 bg-slate-500/[0.02] dark:bg-zinc-950/40 p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                <p className="text-xs font-black text-slate-805 dark:text-white">
                  {qrDialog.doctor?.name || 'Especialista Oasis'}
                </p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-450">
                  Emitida el {formatDate(qrDialog.issue_date, 'dd/MM/yyyy')}
                </p>
                <div className="pt-2">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase border',
                    PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.bgColor,
                    PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.color
                  )}>
                    {PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.label || qrDialog.status}
                  </span>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 dark:text-zinc-550 leading-relaxed font-semibold">
                Certificación y firmas biométricas resguardadas bajo cifrado HMAC. Acreditado por farmacéuticas autorizadas por el MINSA.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
