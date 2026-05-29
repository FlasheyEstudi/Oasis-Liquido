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

const fadeInUp: any = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } },
};

export function PrescriptionList() {
  const { navigate, isElderlyMode } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [qrDialog, setQrDialog] = useState<Prescription | null>(null);

  const params = activeTab !== 'all' ? { status: activeTab as PrescriptionStatus } : undefined;
  const prescriptionsQuery = usePrescriptions(params);
  const prescriptions = prescriptionsQuery.data?.data ?? [];

  const isActive = (status: PrescriptionStatus) =>
    status === 'active' || status === 'partially_fulfilled';

  return (
    <div className={cn(
      "space-y-6 max-w-4xl mx-auto pb-20 relative overflow-visible",
      isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:text-sm [&_button]:h-12"
    )}>
      
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-[10%] left-[-10%] size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-80 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-dashed border-slate-200/50 dark:border-white/5 transition-colors duration-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-2 font-serif">
            <Sparkles className="size-5.5 text-indigo-500 shrink-0" />
            <span>Mis Recetas Digitales</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-455 font-bold mt-1 tracking-wide">
            Validadas por el MINSA y listas para surtido en farmacias autorizadas
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('pharmacy-map')}
          className="w-full sm:w-auto h-11 px-6 rounded-[16px_50px_16px_50px] bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 transition-all duration-300 border-none"
        >
          <Search className="size-4 shrink-0" />
          Buscar farmacias con stock
        </motion.button>
      </div>

      {/* Filter Tabs — Flowing capsule container, no horizontal scroll */}
      <div className="w-full">
        <div className="flex flex-wrap gap-1.5 bg-slate-500/[0.03] dark:bg-zinc-950/20 border border-slate-200/50 dark:border-white/5 p-1.5 rounded-2xl w-full backdrop-blur-xl">
          {FILTER_TABS.map((tab) => {
            const isTabActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'rounded-xl px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 select-none flex-1 text-center min-w-[85px] sm:min-w-0 border',
                  isTabActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'text-slate-550 dark:text-zinc-400 border-transparent hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" key="loading">
            {[1, 2, 3].map((n) => (
              <div key={n} className="shimmer rounded-[2rem] h-48 border border-slate-200/30 dark:border-white/5 opacity-70" />
            ))}
          </div>
        ) : prescriptionsQuery.isError ? (
          <motion.div key="error" {...fadeInUp}>
            <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[40px_16px_32px_16px] p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center py-10 text-center space-y-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md">
                  <AlertCircle className="size-6 text-red-500 animate-bounce" />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-455 leading-relaxed">
                  {getHookErrorMessage(prescriptionsQuery.error)}
                </p>
                <Button
                  className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs px-6"
                  onClick={() => prescriptionsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          </motion.div>
        ) : prescriptions.length === 0 ? (
          <motion.div key="empty" {...fadeInUp}>
            <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[80px_40px_32px_120px] p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center py-14 text-center max-w-sm mx-auto space-y-4.5">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center">
                  <FileText className="size-7 text-slate-400 dark:text-zinc-550" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white font-serif">Sin Recetas</h3>
                  <p className="text-xs text-slate-550 dark:text-zinc-450 font-bold leading-relaxed">
                    No tienes recetas médicas emitidas registradas en esta sección en este momento.
                  </p>
                </div>
              </div>
            </div>
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
                  transition={{ delay: index * 0.02 }}
                >
                  <div
                    style={{
                      borderRadius: index % 2 === 0
                        ? '36px 14px 28px 14px'
                        : '14px 36px 14px 28px'
                    }}
                    className="p-5 border border-slate-200 dark:border-white/5 bg-white/30 dark:bg-zinc-950/20 shadow-xl hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all duration-300 relative flex flex-col justify-between h-full backdrop-blur-xl group"
                    onClick={() => {
                      useAuthStore.getState().setPrescriptionId(presc.id);
                      navigate('prescription-detail', presc.id);
                    }}
                  >
                    <div className="space-y-4">
                      {/* Doctor Profile Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-11 border border-teal-500/10 shrink-0 shadow-sm">
                            <AvatarFallback className="bg-teal-550/10 text-teal-655 dark:text-teal-450 text-xs font-black font-serif">
                              {presc.doctor ? getInitials(presc.doctor.name) : 'DR'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-805 dark:text-white truncate font-serif group-hover:text-indigo-600 transition-colors">
                              Dr. {presc.doctor?.name || 'Médico'}
                            </p>
                            {presc.doctor?.doctor_profile?.specialty && (
                              <p className="text-[9px] font-black text-teal-655 dark:text-teal-400 uppercase tracking-widest mt-1">
                                {presc.doctor.doctor_profile.specialty}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 border shadow-sm',
                          statusConfig?.bgColor,
                          statusConfig?.color
                        )}>
                          {statusConfig?.label || presc.status}
                        </span>
                      </div>

                      {/* Schedule Details block */}
                      <div className="space-y-2.5 bg-white/40 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-white/5 rounded-2xl p-3.5 shadow-inner">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-655 dark:text-zinc-350">
                          <Calendar className="size-3.5 text-indigo-500 shrink-0" />
                          <span>Emitida: {formatDate(presc.issue_date, 'dd MMM yyyy')}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-zinc-400 truncate pt-2 border-t border-dashed border-slate-200 dark:border-white/5">
                          <Pill className="size-3.5 text-teal-500 shrink-0" />
                          <span>{medCount} medicamento{medCount !== 1 ? 's' : ''} prescripto{medCount !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Expiration warning banner */}
                        {presc.status === 'active' && presc.expiration_date && (
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200/50 dark:border-white/5">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>Vence: {formatDate(presc.expiration_date, 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary Actions Row */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      {isActive(presc.status) ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-teal-500 hover:bg-teal-600 text-[9px] font-black uppercase tracking-widest text-white shadow-md shadow-teal-500/10 transition-all duration-300 select-none z-10 border-none"
                          onClick={() => {
                            useAuthStore.getState().setPrescriptionId(presc.id);
                            navigate('pharmacy-map', presc.id);
                          }}
                        >
                          <Search className="size-3 shrink-0" />
                          Surtir Receta
                        </motion.button>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-450 flex items-center gap-1 group-hover:text-indigo-500 transition-colors cursor-pointer" onClick={() => {
                          useAuthStore.getState().setPrescriptionId(presc.id);
                          navigate('prescription-detail', presc.id);
                        }}>
                          Ver Detalles
                          <ChevronRight className="size-3.5" />
                        </span>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-655 dark:text-zinc-350 transition-all duration-300 select-none z-10 cursor-pointer"
                        onClick={() => setQrDialog(presc)}
                      >
                        <QrCodeIcon className="size-3.5 text-indigo-500 shrink-0" />
                        QR
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secure QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={(open) => !open && setQrDialog(null)}>
        <DialogContent className="rounded-[40px_16px_40px_16px] glass-strong border-slate-200 dark:border-white/10 max-w-sm mx-auto p-6 text-center shadow-2xl">
          <DialogHeader className="items-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="size-5 text-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">Verificación de Receta</span>
            </div>
            <DialogTitle className="text-base font-black uppercase tracking-wider text-slate-805 dark:text-white font-serif">Código QR Seguro</DialogTitle>
          </DialogHeader>

          {qrDialog && (
            <div className="flex flex-col items-center py-2 space-y-4">
              <div className="flex justify-center bg-slate-100 dark:bg-white rounded-[2rem] p-4 border border-slate-200/50 shadow-inner w-fit mx-auto">
                <QrCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/family/verify#prescription-${qrDialog.id}`} 
                  size={160} 
                  label="Receta Médica"
                  className="scale-95"
                  showValue={false}
                />
              </div>

              <div className="w-full space-y-1 bg-slate-500/[0.02] dark:bg-zinc-950/40 p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/5 text-center shadow-inner">
                <p className="text-xs font-black text-slate-805 dark:text-white font-serif">
                  Dr. {qrDialog.doctor?.name || 'Especialista Oasis'}
                </p>
                <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-450">
                  Emitida el {formatDate(qrDialog.issue_date, 'dd/MM/yyyy')}
                </p>
                <div className="pt-2">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-black tracking-wider uppercase border shadow-sm',
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
