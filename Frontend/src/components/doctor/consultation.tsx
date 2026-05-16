'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useAppointment,
  useAppointments,
  useMedicines,
  useCreatePrescription,
  useUpdateAppointmentStatus,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { CreatePrescriptionLineRequest } from '@/types';
import { formatDate, getInitials } from '@/utils/helpers';
import { GlassCard } from '@/components/oasis/glass-card';
import { StatusBadge } from '@/components/common/status-badge';
import { QrCode } from '@/components/common/qr-code';
import { ErrorBlock } from '@/components/common/error-block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Droplets,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  Pill,
  QrCode as QrCodeIcon,
  CheckCircle2,
  Loader2,
  Stethoscope,
  Clock,
} from 'lucide-react';

interface PrescriptionLineForm {
  medicine_id: string;
  quantity: number;
  dosage_instructions: string;
}

export function Consultation() {
  const { selectedItemId, user, navigate, setNotification } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(selectedItemId ? 2 : 1);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(selectedItemId ?? null);

  const appointmentsQuery = useAppointments({ status: 'confirmed' });
  const allAppointments = appointmentsQuery.data?.data ?? [];

  const appointmentQuery = useAppointment(selectedAppointmentId ?? '', !!selectedAppointmentId);
  const appointment = appointmentQuery.data;

  const [medicineSearch, setMedicineSearch] = useState('');
  const medicinesQuery = useMedicines(
    medicineSearch.trim() ? { search: medicineSearch } : undefined
  );
  const medicines = medicinesQuery.data?.data ?? [];

  const [notes, setNotes] = useState('');
  const [prescriptionLines, setPrescriptionLines] = useState<PrescriptionLineForm[]>([]);
  const [createdPrescriptionQr, setCreatedPrescriptionQr] = useState<string | null>(null);

  const createPrescriptionMutation = useCreatePrescription();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const patient = appointment?.patient;
  const patientProfile = patient?.patient_profile;

  const addPrescriptionLine = () => {
    setPrescriptionLines((prev) => [
      ...prev,
      { medicine_id: '', quantity: 1, dosage_instructions: '' },
    ]);
  };

  const removePrescriptionLine = (index: number) => {
    setPrescriptionLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePrescriptionLine = (
    index: number,
    field: keyof PrescriptionLineForm,
    value: string | number
  ) => {
    setPrescriptionLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleCreatePrescription = async () => {
    if (!appointment) return;
    if (prescriptionLines.some((l) => !l.medicine_id)) {
      setNotification({ type: 'warning', message: 'Selecciona un medicamento para cada línea' });
      return;
    }
    try {
      const lines: CreatePrescriptionLineRequest[] = prescriptionLines.map((l) => ({
        medicine_id: l.medicine_id,
        quantity: l.quantity,
        dosage_instructions: l.dosage_instructions || undefined,
      }));

      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 3);

      const prescription = await createPrescriptionMutation.mutateAsync({
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
        expiration_date: expirationDate.toISOString().split('T')[0],
        notes: notes || undefined,
        lines,
      });

      setCreatedPrescriptionQr(prescription.qr_code_data);
      setNotification({ type: 'success', message: 'Receta emitida correctamente' });
    } catch {
      setNotification({ type: 'error', message: 'No se pudo emitir la receta' });
    }
  };

  const handleFinishConsultation = async () => {
    if (!appointment) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: appointment.id,
        data: { status: 'completed' },
      });
      setNotification({ type: 'success', message: 'Consulta finalizada' });
      setStep(4);
    } catch {
      setNotification({ type: 'error', message: 'No se pudo finalizar la consulta' });
    }
  };

  // Step 1: Select appointment
  if (step === 1) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('inicio')} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Nueva Consulta</h1>
            <p className="text-sm text-muted-foreground">Selecciona una cita confirmada</p>
          </div>
        </div>

        {appointmentsQuery.isLoading ? (
          <div className="bento-grid">
            <div className="col-span-6 shimmer h-20 rounded-3xl" />
            <div className="col-span-6 shimmer h-20 rounded-3xl" />
          </div>
        ) : appointmentsQuery.isError ? (
          <ErrorBlock
            message={getHookErrorMessage(appointmentsQuery.error)}
            onRetry={() => appointmentsQuery.refetch()}
          />
        ) : allAppointments.length === 0 ? (
          <ErrorBlock
            message="No hay citas confirmadas para iniciar consulta"
            onRetry={() => appointmentsQuery.refetch()}
          />
        ) : (
          <div className="space-y-3">
            {allAppointments.map((apt) => (
              <GlassCard
                key={apt.id}
                hover
                onClick={() => {
                  setSelectedAppointmentId(apt.id);
                  setStep(2);
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                      {apt.patient ? getInitials(apt.patient.name) : 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {apt.patient?.name || 'Paciente'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDate(apt.date_time, "dd/MM/yyyy 'a las' HH:mm")}
                      <span>•</span>
                      <span>{apt.clinic?.name || 'Clínica'}</span>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} type="appointment" />
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (appointmentQuery.isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="bento-grid">
          <div className="col-span-4 shimmer h-64 rounded-3xl" />
          <div className="col-span-8 shimmer h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (appointmentQuery.isError || !appointment) {
    return (
      <div className="p-4 md:p-6">
        <ErrorBlock
          message={appointmentQuery.isError ? getHookErrorMessage(appointmentQuery.error) : 'No se encontró la cita'}
          onRetry={() => appointmentQuery.refetch()}
        />
      </div>
    );
  }

  // Step 4: Done
  if (step === 4) {
    return (
      <div className="p-4 md:p-6">
        <GlassCard className="max-w-md mx-auto text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-4">
            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Consulta Finalizada</h2>
          <p className="text-sm text-muted-foreground mb-6">
            La consulta ha sido marcada como completada.
          </p>
          <Button
            className="glass-btn-primary rounded-full"
            onClick={() => navigate('inicio')}
          >
            Volver al inicio
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('inicio')} className="rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Consulta médica</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(appointment.date_time, "dd/MM/yyyy 'a las' HH:mm")}
          </p>
        </div>
        <StatusBadge status={appointment.status} type="appointment" />
      </div>

      <div className="bento-grid">
        {/* Left Column - Patient Info */}
        <div className="col-span-4 space-y-4">
          {/* Patient Card */}
          <GlassCard>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Paciente</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-lg font-semibold">
                    {patient ? getInitials(patient.name) : 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {patient?.name || 'Paciente'}
                  </p>
                  <p className="text-xs text-muted-foreground">{patient?.email}</p>
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="space-y-3">
                {patientProfile?.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Edad:</span>
                    <span className="font-medium text-foreground">
                      {Math.floor(
                        (Date.now() - new Date(patientProfile.date_of_birth).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )}{' '}
                      años
                    </span>
                  </div>
                )}
                {patientProfile?.blood_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="size-4 text-red-400" />
                    <span className="text-muted-foreground">Tipo de sangre:</span>
                    <Badge
                      variant="outline"
                      className="border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"
                    >
                      {patientProfile.blood_type}
                    </Badge>
                  </div>
                )}
              </div>

              {patientProfile?.allergies && patientProfile.allergies.length > 0 && (
                <>
                  <Separator className="opacity-50" />
                  <div>
                    <div className="mb-2 flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="size-4" />
                      Alergias
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {patientProfile.allergies.map((allergy, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"
                        >
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {patientProfile?.medical_notes && (
                <>
                  <Separator className="opacity-50" />
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-sm font-medium text-foreground">
                      <FileText className="size-4 text-muted-foreground" />
                      Notas médicas
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patientProfile.medical_notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Clinic Info */}
          {appointment.clinic && (
            <GlassCard>
              <p className="text-xs text-muted-foreground">Clínica</p>
              <p className="text-sm font-medium text-foreground">
                {appointment.clinic.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {appointment.clinic.address}
              </p>
            </GlassCard>
          )}
        </div>

        {/* Right Column - Consultation Form */}
        <div className="col-span-8 space-y-4">
          {/* Step navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant={step === 2 ? 'default' : 'outline'}
              className={cn(
                'rounded-full text-sm',
                step === 2 && 'bg-teal-600 hover:bg-teal-700 text-white',
              )}
              onClick={() => setStep(2)}
              size="sm"
            >
              <Stethoscope className="size-3.5 mr-1" />
              Info del paciente
            </Button>
            <Button
              variant={step === 3 ? 'default' : 'outline'}
              className={cn(
                'rounded-full text-sm',
                step === 3 && 'bg-teal-600 hover:bg-teal-700 text-white',
              )}
              onClick={() => setStep(3)}
              size="sm"
            >
              <Pill className="size-3.5 mr-1" />
              Receta médica
            </Button>
          </div>

          {/* Step 2: Notes */}
          {step === 2 && (
            <GlassCard>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Notas de consulta
              </h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Añadir notas sobre la consulta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="glass-input rounded-2xl resize-none"
                />
                <Button
                  className="glass-btn-primary rounded-full"
                  onClick={() => setStep(3)}
                >
                  Continuar a receta
                </Button>
              </div>
            </GlassCard>
          )}

          {/* Step 3: Prescription */}
          {step === 3 && (
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Pill className="size-4" />
                  Receta médica
                </h3>
                {!createdPrescriptionQr && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addPrescriptionLine}
                    className="rounded-full gap-1"
                  >
                    <Plus className="size-3" />
                    Agregar medicamento
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {prescriptionLines.length === 0 && !createdPrescriptionQr && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hay medicamentos en la receta. Haz clic en &quot;Agregar medicamento&quot; para añadir.
                  </p>
                )}

                {prescriptionLines.map((line, index) => (
                  <div
                    key={index}
                    className="glass-input rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Medicamento {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-full"
                        onClick={() => removePrescriptionLine(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Medicamento</Label>
                        <Select
                          value={line.medicine_id}
                          onValueChange={(val) =>
                            updatePrescriptionLine(index, 'medicine_id', val)
                          }
                        >
                          <SelectTrigger className="glass-input rounded-xl">
                            <SelectValue placeholder="Buscar medicamento..." />
                          </SelectTrigger>
                          <SelectContent>
                            {medicines.map((med) => (
                              <SelectItem key={med.id} value={med.id}>
                                {med.name} {med.strength && `(${med.strength})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updatePrescriptionLine(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="glass-input rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Instrucciones de dosificación</Label>
                      <Input
                        placeholder="Ej: 1 tableta cada 8 horas"
                        value={line.dosage_instructions}
                        onChange={(e) =>
                          updatePrescriptionLine(index, 'dosage_instructions', e.target.value)
                        }
                        className="glass-input rounded-xl"
                      />
                    </div>
                  </div>
                ))}

                {/* Prescription QR */}
                {createdPrescriptionQr && (
                  <div className="flex flex-col items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                    <CheckCircle2 className="mb-2 size-8 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="mb-4 font-semibold text-emerald-700 dark:text-emerald-400">
                      Receta emitida correctamente
                    </h3>
                    <QrCode value={createdPrescriptionQr} size={180} />
                  </div>
                )}

                {/* Emit Prescription Button */}
                {prescriptionLines.length > 0 && !createdPrescriptionQr && (
                  <Button
                    className="glass-btn-primary w-full rounded-full"
                    onClick={handleCreatePrescription}
                    disabled={createPrescriptionMutation.isPending}
                  >
                    {createPrescriptionMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Emitiendo receta...
                      </>
                    ) : (
                      <>
                        <QrCodeIcon className="size-4" />
                        Emitir receta
                      </>
                    )}
                  </Button>
                )}
              </div>
            </GlassCard>
          )}

          {/* Finish Consultation */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('inicio')} className="rounded-full">
              Volver
            </Button>
            <Button
              className="glass-btn-primary rounded-full"
              onClick={handleFinishConsultation}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Finalizar consulta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
