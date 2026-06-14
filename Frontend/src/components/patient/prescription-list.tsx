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
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
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
      "space-y-6 max-w-4xl mx-auto pb-20 relative overflow-visible px-1 sm:px-0",
      isElderlyMode && "text-base font-medium [&_h2]:text-3xl [&_h3]:text-xl [&_p]:text-sm [&_span]:text-xs [&_button]:text-sm [&_button]:h-12"
    )}>
      
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-[10%] left-[-10%] size-80 rounded-full bg-gradient-to-br from-sky-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] size-80 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-dashed border-slate-200/50 dark:border-white/5 transition-colors duration-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 font-serif">
            <Sparkles className="size-5.5 text-sky-500 shrink-0" />
            <span>Mis Recetas Digitales</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold mt-1 tracking-wide">
            Validadas por el MINSA y listas para surtido en farmacias autorizadas
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('pharmacy-map')}
          className="w-full sm:w-auto h-11 px-6 rounded-[16px_50px_16px_50px] bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[inset_0_3px_6px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.15),0_10px_25px_rgba(20,184,166,0.2)] transition-all duration-300 border-none"
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
                    ? 'bg-sky-600 border-sky-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-zinc-400 border-transparent hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
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
          <div className="space-y-4" key="loading">
            {[1, 2, 3].map((n) => (
              <div key={n} className="shimmer rounded-2xl h-24 border border-slate-200/30 dark:border-white/5 opacity-70" />
            ))}
          </div>
        ) : prescriptionsQuery.isError ? (
          <motion.div key="error" {...fadeInUp}>
            <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 rounded-[40px_16px_32px_16px] p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center py-10 text-center space-y-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-md">
                  <AlertCircle className="size-6 text-red-500 animate-bounce" />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 leading-relaxed">
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
            <div className="border border-slate-200 dark:border-white/5 bg-white/20 dark:bg-zinc-950/20 sm:rounded-[80px_40px_32px_120px] rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex flex-col items-center py-14 text-center max-w-sm mx-auto space-y-4.5">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 flex items-center justify-center">
                  <FileText className="size-7 text-slate-400 dark:text-zinc-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white font-serif">Sin Recetas</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold leading-relaxed">
                    No tienes recetas médicas emitidas registradas en esta sección en este momento.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* CARDLESS TIMELINE FEED PANEL */
          <motion.div
            key={activeTab}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 sm:rounded-[40px_16px_40px_16px] rounded-3xl backdrop-blur-md overflow-hidden p-2 sm:p-4 shadow-xl"
          >
            <div className="divide-y divide-dashed divide-slate-200/60 dark:divide-white/5">
              {prescriptions.map((presc, index) => {
                const medCount = presc.lines?.length || 0;
                const statusConfig = PRESCRIPTION_STATUS_CONFIG[presc.status];

                // Set color of neon vertical accent bar based on prescription status
                const accentColor = 
                  presc.status === 'fulfilled' ? 'bg-emerald-500' :
                  presc.status === 'expired' ? 'bg-amber-500' :
                  'bg-sky-500';

                return (
                  <motion.div
                    key={presc.id}
                    variants={fadeInUp}
                    transition={{ delay: index * 0.02 }}
                    className="py-5 px-3 sm:px-5 hover:bg-slate-500/[0.03] dark:hover:bg-white/[0.02] cursor-pointer transition-all duration-200 relative flex flex-col md:flex-row md:items-center justify-between gap-4 group rounded-2xl overflow-visible"
                    onClick={() => {
                      useAuthStore.getState().setPrescriptionId(presc.id);
                      navigate('prescription-detail', presc.id);
                    }}
                  >
                    {/* Punch Hole ticket cutouts on left and right margins — blends with solid page background */}
                    <div className="absolute left-[-11px] top-1/2 -translate-y-1/2 size-5 rounded-full bg-white dark:bg-zinc-950 border-r border-slate-200/50 dark:border-white/10 z-20 pointer-events-none" />
                    <div className="absolute right-[-11px] top-1/2 -translate-y-1/2 size-5 rounded-full bg-white dark:bg-zinc-950 border-l border-slate-200/50 dark:border-white/10 z-20 pointer-events-none" />

                    {/* Glowing neon status timeline accent on the left margin */}
                    <div className={cn("absolute left-1 top-3 bottom-3 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-y-110", accentColor)} />

                    {/* Left side details */}
                    <div className="flex items-center gap-4 min-w-0 pl-3">
                      <Avatar className="size-11 sm:size-12 border border-slate-200 dark:border-white/5 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarFallback className="bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-xs font-black font-serif">
                          {presc.doctor ? getInitials(presc.doctor.name) : 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate font-serif group-hover:text-sky-600 transition-colors">
                            Dr. {presc.doctor?.name || 'Médico'}
                          </p>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 border scale-95 shadow-sm',
                            statusConfig?.bgColor,
                            statusConfig?.color
                          )}>
                            {statusConfig?.label || presc.status}
                          </span>
                        </div>
                        {presc.doctor?.doctor_profile?.specialty && (
                          <p className="text-[9px] sm:text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-0.5">
                            {presc.doctor.doctor_profile.specialty}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-bold mt-1.5 flex items-center gap-1">
                          <Pill className="size-3 text-teal-500 shrink-0" />
                          <span>{medCount} medicamento{medCount !== 1 ? 's' : ''} prescripto{medCount !== 1 ? 's' : ''}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right side telemetry info */}
                    <div className="flex items-center justify-between md:justify-end gap-5 pl-3 md:pl-0 border-t md:border-t-0 border-dashed border-slate-200 dark:border-white/5 pt-3.5 md:pt-0">
                      <div className="text-left md:text-right font-bold text-[11px] text-slate-600 dark:text-zinc-400 space-y-0.5">
                        <div className="flex items-center md:justify-end gap-1.5">
                          <Calendar className="size-3.5 text-sky-500 shrink-0" />
                          <span>Emitida: {formatDate(presc.issue_date, 'dd MMM yyyy')}</span>
                        </div>
                        {presc.status === 'active' && presc.expiration_date && (
                          <div className="flex items-center md:justify-end gap-1.5 text-[9px] font-black text-amber-600 dark:text-amber-400 pt-0.5">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>Vence: {formatDate(presc.expiration_date, 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isActive(presc.status) ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-teal-500 hover:bg-teal-600 text-[9px] font-black uppercase tracking-widest text-white shadow-md transition-all duration-200 select-none z-10 border-none cursor-pointer"
                            onClick={() => {
                              useAuthStore.getState().setPrescriptionId(presc.id);
                              navigate('pharmacy-map', presc.id);
                            }}
                          >
                            <Search className="size-3 shrink-0" />
                            Surtir
                          </motion.button>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400 flex items-center gap-1 group-hover:text-sky-500 transition-colors cursor-pointer" onClick={() => {
                            useAuthStore.getState().setPrescriptionId(presc.id);
                            navigate('prescription-detail', presc.id);
                          }}>
                            Detalles
                            <ChevronRight className="size-3.5" />
                          </span>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="size-8 rounded-full bg-slate-500/5 hover:bg-sky-500/10 text-slate-400 hover:text-sky-500 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                          onClick={() => setQrDialog(presc)}
                        >
                          <QrCodeIcon className="size-4 shrink-0" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secure QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={(open) => !open && setQrDialog(null)}>
        <DialogContent className="sm:rounded-[2.5rem] rounded-3xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 max-w-md mx-auto p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Código QR Seguro de Receta</DialogTitle>
          </DialogHeader>

          {qrDialog && (
            <div className="flex flex-col items-center py-2 space-y-6">
              {/* Boarding Pass Ticket */}
              <div className="w-full flex flex-col items-stretch space-y-0 text-left bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                
                {/* Top Section */}
                <div className="p-6 space-y-5">
                  {/* Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/25">
                        <Shield className="size-3" /> MINSA Valido
                      </span>
                    </div>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border shadow-sm',
                      PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.bgColor,
                      PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.color
                    )}>
                      {PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.label || qrDialog.status}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="size-14 border border-slate-200 dark:border-zinc-800 shrink-0 shadow-sm">
                      <AvatarFallback className="bg-sky-500/5 text-sky-500 dark:text-sky-400 text-xs font-black font-serif">
                        {getInitials(qrDialog.doctor?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest leading-none">Médico Emisor</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5 truncate font-serif">Dr. {qrDialog.doctor?.name}</p>
                      {qrDialog.doctor?.doctor_profile?.specialty && (
                        <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-0.5">{qrDialog.doctor.doctor_profile.specialty}</p>
                      )}
                    </div>
                  </div>

                  {/* Schedule & Clinic Details Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-200 dark:border-zinc-800/60">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest leading-none">Fecha de Emisión</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1">{formatDate(qrDialog.issue_date, "dd 'de' MMMM")}</p>
                      {qrDialog.expiration_date && (
                        <p className="text-[9px] text-amber-500 font-black uppercase tracking-wider mt-0.5">Vence: {formatDate(qrDialog.expiration_date, 'dd/MM/yyyy')}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest leading-none">Medicamentos</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1">{qrDialog.lines?.length || 0} Formulados</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold truncate mt-0.5">Autorizado para Surtido</p>
                    </div>
                  </div>
                </div>

                {/* Perforated separator (punch holes) */}
                <div className="relative h-4 w-full flex items-center justify-center pointer-events-none select-none my-0.5">
                  <div className="w-full border-t-2 border-dashed border-slate-200 dark:border-zinc-800" />
                  <div className="absolute left-0 -translate-x-1/2 size-6 rounded-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800" />
                  <div className="absolute right-0 translate-x-1/2 size-6 rounded-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800" />
                </div>

                {/* Bottom Section - QR pass focused */}
                <div className="p-6 flex flex-col items-center text-center space-y-4 bg-slate-100/30 dark:bg-zinc-950/20">
                  <p className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.25em]">Pase Digital de Receta</p>
                  
                  {/* QR container */}
                  <div className="relative bg-white p-4 rounded-2xl shadow-xl overflow-hidden shrink-0">
                    {/* Scanner glow animation */}
                    <motion.div 
                      animate={{ top: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-sky-500/25 to-transparent z-10 pointer-events-none"
                    />
                    <div className="relative flex items-center justify-center overflow-hidden p-1 bg-white">
                      <QrCode 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/family/verify#prescription-${qrDialog.id}`} 
                        size={130} 
                        className="!p-0"
                        showValue={false}
                      />
                    </div>
                    
                    {/* Corners */}
                    <div className="absolute top-2 left-2 size-3.5 border-t-2 border-l-2 border-sky-500/60 rounded-tl" />
                    <div className="absolute top-2 right-2 size-3.5 border-t-2 border-r-2 border-sky-500/60 rounded-tr" />
                    <div className="absolute bottom-2 left-2 size-3.5 border-b-2 border-l-2 border-sky-500/60 rounded-bl" />
                    <div className="absolute bottom-2 right-2 size-3.5 border-b-2 border-r-2 border-sky-500/60 rounded-br" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-[0.2em]">Escánear en Farmacia</p>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-400 max-w-[250px] font-semibold leading-normal">
                      Presenta este código al farmacéutico para despachar y registrar tus medicamentos autorizados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs h-11 border border-slate-200 dark:border-zinc-800 cursor-pointer transition-colors"
                onClick={() => setQrDialog(null)}
              >
                Cerrar Recibo
              </motion.button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
