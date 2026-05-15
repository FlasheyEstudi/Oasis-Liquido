'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  usePrescription,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDate, getInitials } from '@/utils/helpers';
import { PRESCRIPTION_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Search,
  Calendar,
  Building2,
  Clock,
  FileText,
  Pill,
  StickyNote,
  AlertCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export function PrescriptionDetail() {
  const { selectedItemId, navigate } = useAuthStore();
  const prescriptionQuery = usePrescription(selectedItemId ?? '', !!selectedItemId);

  if (!selectedItemId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('prescriptions')}
        >
          <ArrowLeft className="size-4" />
          Volver a recetas
        </Button>
        <GlassCard>
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500/50 mb-3" />
            <p className="text-sm text-muted-foreground">No se especificó una receta</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (prescriptionQuery.isLoading) {
    return (
      <div className="bento-grid">
        <div className="col-span-12"><div className="shimmer rounded-3xl h-48" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-64" /></div>
      </div>
    );
  }

  if (prescriptionQuery.isError || !prescriptionQuery.data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('prescriptions')}
        >
          <ArrowLeft className="size-4" />
          Volver a recetas
        </Button>
        <GlassCard>
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {prescriptionQuery.isError ? getHookErrorMessage(prescriptionQuery.error) : 'Receta no encontrada'}
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => prescriptionQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const prescription = prescriptionQuery.data;
  const statusConfig = PRESCRIPTION_STATUS_CONFIG[prescription.status];

  // Calculate fulfillment progress
  const totalQuantity = prescription.lines?.reduce((sum, l) => sum + l.quantity, 0) || 0;
  const fulfilledQuantity = prescription.lines?.reduce((sum, l) => sum + l.quantity_fulfilled, 0) || 0;
  const progressPercent = totalQuantity > 0 ? Math.round((fulfilledQuantity / totalQuantity) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        className="rounded-full gap-2 text-muted-foreground"
        onClick={() => navigate('prescriptions')}
      >
        <ArrowLeft className="size-4" />
        Volver a recetas
      </Button>

      <div className="bento-grid">
        {/* Prescription Header + QR — col-span-8 */}
        <GlassCard className="col-span-8">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0">
              <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-lg font-semibold">
                {prescription.doctor ? getInitials(prescription.doctor.name) : 'DR'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {prescription.doctor?.name || 'Médico'}
                  </h2>
                  {prescription.doctor?.doctor_profile?.specialty && (
                    <p className="text-sm text-muted-foreground">
                      {prescription.doctor.doctor_profile.specialty}
                    </p>
                  )}
                </div>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0',
                  statusConfig?.bgColor,
                  statusConfig?.color
                )}>
                  {statusConfig?.label || prescription.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(prescription.issue_date, 'dd/MM/yyyy')}
                </span>
                {prescription.clinic && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" />
                    {prescription.clinic.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Vence: {formatDate(prescription.expiration_date, 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="mt-6 flex justify-center">
            <div className="rounded-2xl border border-border bg-white dark:bg-white p-3 shadow-sm">
              <QRCodeSVG value={prescription.qr_code_data} size={140} level="M" includeMargin />
            </div>
          </div>
        </GlassCard>

        {/* Fulfillment Progress — col-span-4 */}
        <GlassCard className="col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-teal-500/10">
              <Pill className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Surtimiento</h3>
          </div>

          {/* Circular progress indicator */}
          <div className="flex justify-center mb-4">
            <div className="relative size-28">
              <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="currentColor" strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 2.51} 251`}
                  className="text-teal-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{progressPercent}%</span>
                <span className="text-[10px] text-muted-foreground">surtido</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {fulfilledQuantity} de {totalQuantity} unidades
            </span>
          </div>
        </GlassCard>

        {/* Medication Lines — col-span-12 */}
        <GlassCard className="col-span-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-sky-500/10">
              <FileText className="size-3.5 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Medicamentos</h3>
          </div>

          <div className="space-y-0">
            {prescription.lines?.map((line, index) => {
              const lineProgress = line.quantity > 0
                ? Math.round((line.quantity_fulfilled / line.quantity) * 100)
                : 0;
              const isFulfilled = line.quantity_fulfilled >= line.quantity;
              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'py-4',
                    index > 0 && 'border-t border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full mt-0.5">
                        {isFulfilled ? (
                          <CheckCircle2 className="size-5 text-emerald-500" />
                        ) : lineProgress > 0 ? (
                          <Circle className="size-5 text-amber-500" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {line.medicine?.name || 'Medicamento'}
                        </p>
                        {line.dosage_instructions && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {line.dosage_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">
                        {line.quantity_fulfilled}/{line.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">unidades</p>
                    </div>
                  </div>
                    {/* Senior-friendly reminder button */}
                    <div className="mt-3 ml-10 flex flex-col gap-2">
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isFulfilled ? 'bg-emerald-500' : lineProgress > 0 ? 'bg-amber-500' : 'bg-muted-foreground/20'
                          )}
                          style={{ width: `${lineProgress}%` }}
                        />
                      </div>
                      
                      {!isFulfilled && line.dosage_instructions && (
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toast.success(`Alarma programada: ${line.medicine?.name} cada ${line.dosage_instructions.match(/\d+/)?.[0] || '8'} horas`)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all text-left"
                        >
                          <div className="size-10 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0">
                            <Clock className="size-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Programar Recordatorio</p>
                            <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 font-medium">Notificarme {line.dosage_instructions}</p>
                          </div>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            {(!prescription.lines || prescription.lines.length === 0) && (
              <p className="py-4 text-sm text-muted-foreground text-center">
                No hay medicamentos en esta receta
              </p>
            )}
          </div>
        </GlassCard>

        {/* Notes — col-span-12 */}
        {prescription.notes && (
          <GlassCard className="col-span-12">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/10">
                <StickyNote className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Notas</h3>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {prescription.notes}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Search Pharmacies Button */}
      {(prescription.status === 'active' || prescription.status === 'partially_fulfilled') && (
        <Button
          className="w-full glass-btn-primary rounded-full gap-2 h-12 text-base mt-4"
          onClick={() => navigate('pharmacy-map', prescription.id)}
        >
          <Search className="size-5" />
          Buscar farmacias con stock
        </Button>
      )}
    </div>
  );
}
