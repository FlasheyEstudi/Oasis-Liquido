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
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  QrCode as QrCodeIcon,
  Pill,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const FILTER_TABS: { value: string; label: string; status?: PrescriptionStatus }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas', status: 'active' },
  { value: 'partially_fulfilled', label: 'Parciales', status: 'partially_fulfilled' },
  { value: 'fulfilled', label: 'Surtidas', status: 'fulfilled' },
  { value: 'expired', label: 'Expiradas', status: 'expired' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function PrescriptionList() {
  const { navigate } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [qrDialog, setQrDialog] = useState<Prescription | null>(null);

  // Build query params based on active tab
  const params = activeTab !== 'all' ? { status: activeTab as PrescriptionStatus } : undefined;
  const prescriptionsQuery = usePrescriptions(params);
  const prescriptions = prescriptionsQuery.data?.data ?? [];

  const isActive = (status: PrescriptionStatus) =>
    status === 'active' || status === 'partially_fulfilled';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h2
          {...fadeInUp}
          className="text-xl font-bold text-foreground"
        >
          Mis Recetas
        </motion.h2>
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Button
            onClick={() => navigate('pharmacy-map')}
            className="glass-btn-primary rounded-full gap-2 h-9"
          >
            <Search className="size-4" />
            Buscar farmacias
          </Button>
        </motion.div>
      </div>

      {/* Filter Tabs — Glass pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {FILTER_TABS.map((tab, i) => (
          <motion.button
            key={tab.value}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.value
                ? 'glass-btn-primary text-white'
                : 'glass text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {prescriptionsQuery.isLoading ? (
          <div className="bento-grid" key="loading">
            <div className="col-span-6"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-6"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
            <div className="col-span-4"><div className="shimmer rounded-3xl h-36" /></div>
          </div>
        ) : prescriptionsQuery.isError ? (
          <motion.div key="error" {...fadeInUp}>
            <GlassCard>
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 mb-4">
                  <AlertCircle className="size-7 text-red-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {getHookErrorMessage(prescriptionsQuery.error)}
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => prescriptionsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ) : prescriptions.length === 0 ? (
          <motion.div key="empty" {...fadeInUp}>
            <GlassCard>
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="size-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-semibold mb-1">Sin recetas</h3>
                <p className="text-sm text-muted-foreground">
                  No tienes recetas en esta categoría
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bento-grid"
          >
            {prescriptions.map((presc, index) => {
              const medCount = presc.lines?.length || 0;
              const statusConfig = PRESCRIPTION_STATUS_CONFIG[presc.status];
              return (
                <motion.div
                  key={presc.id}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.04 }}
                  className="col-span-6 lg:col-span-4"
                >
                  <GlassCard
                    hover
                    className="!p-4"
                    onClick={() => navigate('prescription-detail', presc.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* QR Icon */}
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                        <QrCodeIcon className="size-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {presc.doctor?.name || 'Médico'}
                            </p>
                            {presc.doctor?.doctor_profile?.specialty && (
                              <p className="text-xs text-muted-foreground">
                                {presc.doctor.doctor_profile.specialty}
                              </p>
                            )}
                          </div>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0',
                            statusConfig?.bgColor,
                            statusConfig?.color
                          )}>
                            {statusConfig?.label || presc.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDate(presc.issue_date, 'dd MMM yyyy')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Pill className="size-3" />
                            {medCount} medicamento{medCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Expiration warning */}
                        {presc.status === 'active' && presc.expiration_date && (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            Vence: {formatDate(presc.expiration_date, 'dd/MM/yyyy')}
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {isActive(presc.status) && (
                            <button
                              className="glass-btn-primary rounded-full h-7 text-xs gap-1.5 px-3 flex items-center"
                              onClick={() => navigate('pharmacy-map', presc.id)}
                            >
                              <Search className="size-3" />
                              Buscar farmacias
                            </button>
                          )}
                          <button
                            className="glass-btn-secondary rounded-full h-7 text-xs gap-1.5 px-3 flex items-center"
                            onClick={() => setQrDialog(presc)}
                          >
                            <QrCodeIcon className="size-3" />
                            QR
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={(open) => !open && setQrDialog(null)}>
        <DialogContent className="rounded-3xl glass-strong border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Código QR de Receta</DialogTitle>
          </DialogHeader>
          {qrDialog && (
            <div className="flex flex-col items-center py-4">
              <div className="rounded-2xl border border-border bg-white dark:bg-white p-3 shadow-sm">
                <QRCodeSVG value={qrDialog.qr_code_data} size={180} level="M" includeMargin />
              </div>
              <div className="mt-4 text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {qrDialog.doctor?.name || 'Médico'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Emitida: {formatDate(qrDialog.issue_date, 'dd/MM/yyyy')}
                </p>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium',
                  PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.bgColor,
                  PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.color
                )}>
                  {PRESCRIPTION_STATUS_CONFIG[qrDialog.status]?.label || qrDialog.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
