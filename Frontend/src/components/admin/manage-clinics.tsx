'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useClinics,
  useCreateClinic,
  useUpdateClinic,
  useUsers,
  useClinicSettings,
  useUpdateClinicSettings,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatCurrency } from '@/utils/helpers';
import type { Clinic } from '@/types';
import { GlassCard } from '@/components/oasis/glass-card';
import { ClinicStaffManagement } from '../common/staff-management';
import { CashReconciliation } from '../common/cash-reconciliation';
import {
  CircularPerformanceRadar,
  AppointmentWaveform,
  PatientJourneyTimeline,
  NoShowPredictionGauge,
} from '@/components/common/charts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Phone,
  MapPin,
  Loader2,
  Activity,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ClinicFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  ownerId: string;
  isActive: boolean;
}

const emptyForm: ClinicFormData = {
  name: '',
  address: '',
  latitude: '12.1364',
  longitude: '-86.2514',
  phone: '',
  ownerId: '',
  isActive: true,
};

export function ManageClinics() {
  const { user, setNotification, currentPage } = useAuthStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [form, setForm] = useState<ClinicFormData>(emptyForm);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setNotification({ type: 'warning', message: 'Tu navegador no soporta geolocalización o no está en un entorno seguro (HTTPS)' });
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((f) => ({
          ...f,
          latitude: String(position.coords.latitude.toFixed(6)),
          longitude: String(position.coords.longitude.toFixed(6)),
        }));
        setNotification({ type: 'success', message: 'Ubicación obtenida con precisión vía GPS' });
        setIsDetecting(false);
      },
      (error) => {
        let msg = 'No se pudo obtener la ubicación GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso denegado. Por favor, habilita el GPS y los permisos de ubicación de tu navegador.';
        }
        setNotification({ type: 'warning', message: msg });
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const {
    data: clinicsResult,
    isLoading,
    error,
    refetch,
  } = useClinics({ search: search || undefined });

  const clinics = clinicsResult?.data ?? [];

  const { data: ownersResult } = useUsers({ role: 'clinic_admin' });
  const owners = ownersResult?.data ?? [];

  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();

  // --- Clinic Admin Settings states & mutations ---
  const { data: clinicSettings } = useClinicSettings();
  const updateClinicSettings = useUpdateClinicSettings();

  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editOpenTime, setEditOpenTime] = useState('08:00');
  const [editCloseTime, setEditCloseTime] = useState('17:00');

  const ownedClinic = clinics.find(
    (c) => c.ownerId === user?.id || c.owner_id === user?.id
  );

  useEffect(() => {
    if (ownedClinic) {
      setEditPhone(ownedClinic.phone || '');
      setEditAddress(ownedClinic.address || '');
    }
    if (clinicSettings) {
      setEditFee(String(clinicSettings.consultationFeeDefault ?? 0));
      const hours = clinicSettings.hoursOfOperation as Record<string, string> || {};
      setEditOpenTime(hours.open || '08:00');
      setEditCloseTime(hours.close || '17:00');
    }
  }, [ownedClinic, clinicSettings]);

  const handleSaveSettings = async () => {
    if (!ownedClinic) return;
    if (!editAddress.trim()) {
      setNotification({ type: 'warning', message: 'La dirección es obligatoria' });
      return;
    }

    try {
      // 1. Update clinic base info
      await updateClinic.mutateAsync({
        id: ownedClinic.id,
        data: {
          name: ownedClinic.name,
          address: editAddress.trim(),
          phone: editPhone.trim() || undefined,
          latitude: ownedClinic.latitude,
          longitude: ownedClinic.longitude,
        }
      });

      // 2. Update clinic settings info
      await updateClinicSettings.mutateAsync({
        consultationFeeDefault: parseFloat(editFee) || 0.0,
        hoursOfOperation: {
          open: editOpenTime,
          close: editCloseTime,
        }
      });

      setNotification({ type: 'success', message: 'Configuración de clínica actualizada con éxito' });
      setIsEditSettingsOpen(false);
      refetch();
    } catch (err) {
      setNotification({ type: 'error', message: 'Error al actualizar la configuración de la clínica' });
    }
  };

  const isSaving = createClinic.isPending || updateClinic.isPending || updateClinicSettings.isPending;

  const handleOpenCreate = () => {
    setEditingClinic(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setForm({
      name: clinic.name,
      address: clinic.address,
      latitude: String(clinic.latitude),
      longitude: String(clinic.longitude),
      phone: clinic.phone || '',
      ownerId: clinic.ownerId || clinic.owner_id || '',
      isActive: clinic.isActive ?? clinic.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.address.trim()) {
      setNotification({ type: 'warning', message: 'Nombre y dirección son obligatorios' });
      return;
    }

    const data = {
      name: form.name.trim(),
      address: form.address.trim(),
      latitude: parseFloat(form.latitude) || 12.1364,
      longitude: parseFloat(form.longitude) || -86.2514,
      phone: form.phone.trim() || undefined,
      ownerId: form.ownerId || undefined,
      isActive: form.isActive,
    };

    if (editingClinic) {
      updateClinic.mutate(
        { id: editingClinic.id, data },
        {
          onSuccess: () => {
            setNotification({ type: 'success', message: 'Clínica actualizada' });
            setDialogOpen(false);
          },
          onError: () => {
            setNotification({ type: 'error', message: 'No se pudo actualizar la clínica' });
          },
        },
      );
    } else {
      createClinic.mutate(data, {
        onSuccess: () => {
          setNotification({ type: 'success', message: 'Clínica creada' });
          setDialogOpen(false);
        },
        onError: () => {
          setNotification({ type: 'error', message: 'No se pudo crear la clínica' });
        },
      });
    }
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
          {getHookErrorMessage(error) || 'No se pudieron cargar las clínicas'}
        </p>
        <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  const isClinicOwner = user?.role === 'clinic_admin';

  if (isClinicOwner) {
    if (!ownedClinic) {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <GlassCard className="text-center py-16">
            <Building2 className="size-16 text-teal-500/40 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sin Clínica Asignada</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Actualmente no tienes ninguna clínica asociada a tu cuenta. Contacta con el equipo de soporte de OASIS para vincular tu clínica.
            </p>
          </GlassCard>
        </div>
      );
    }

    if (currentPage === 'clinic-staff') {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-2xl font-bold text-foreground">Gestión de Personal</h1>
            <p className="text-sm text-muted-foreground">Invita y administra doctores, recepcionistas y personal de la clínica</p>
          </motion.div>
          <div>
            <ClinicStaffManagement clinicId={ownedClinic.id} />
          </div>
        </div>
      );
    }

    if (currentPage === 'clinic-finances') {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-2xl font-bold text-foreground">Arqueo y Conciliación de Caja</h1>
            <p className="text-sm text-muted-foreground">Monitoreo de ingresos de caja física vs digital en tiempo real y bitácora de auditoría</p>
          </motion.div>
          <div>
            <CashReconciliation entityId={ownedClinic.id} type="clinics" />
          </div>
        </div>
      );
    }

    if (currentPage === 'clinic-analytics') {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-2xl font-bold text-foreground">Analíticas y KPIs de Clínica</h1>
            <p className="text-sm text-muted-foreground">Métricas en tiempo real y predictivas para optimización de sede</p>
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <CircularPerformanceRadar />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <AppointmentWaveform />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <PatientJourneyTimeline />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <NoShowPredictionGauge />
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-2xl font-bold text-foreground">Información de Sede</h1>
          <p className="text-sm text-muted-foreground">Detalles de ubicación, contacto y estado físico de tu clínica</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
          <GlassCard className="border border-teal-500/10 shadow-lg relative overflow-hidden p-6 md:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-6 border-b pb-3 border-border/20">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Building2 className="size-6 text-teal-500" />
                Sede Registrada
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (ownedClinic) {
                    setEditPhone(ownedClinic.phone || '');
                    setEditAddress(ownedClinic.address || '');
                  }
                  if (clinicSettings) {
                    setEditFee(String(clinicSettings.consultationFeeDefault ?? 0));
                    const hours = clinicSettings.hoursOfOperation as Record<string, string> || {};
                    setEditOpenTime(hours.open || '08:00');
                    setEditCloseTime(hours.close || '17:00');
                  }
                  setIsEditSettingsOpen(true);
                }}
                className="glass-btn-secondary rounded-full h-8 px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <Pencil className="size-3.5" />
                Editar Sede
              </Button>
            </div>
            
            <div className="space-y-6 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium mb-1">Nombre de la Clínica</span>
                  <span className="text-foreground font-bold text-lg">{ownedClinic.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium mb-1">Estado de Sede</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Activo y Operando
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-medium mb-1">Dirección Física</span>
                <span className="text-foreground flex items-start gap-2 text-base">
                  <MapPin className="size-5 text-teal-500 shrink-0 mt-0.5" />
                  {ownedClinic.address}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {ownedClinic.phone ? (
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium mb-1">Teléfono de Contacto</span>
                    <span className="text-foreground flex items-center gap-2 text-base">
                      <Phone className="size-5 text-teal-500 shrink-0" />
                      {ownedClinic.phone}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium mb-1">Teléfono de Contacto</span>
                    <span className="text-muted-foreground italic">No registrado</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground block font-medium mb-1">Tarifa de Consulta Base</span>
                  <span className="text-foreground font-bold text-base flex items-center gap-1.5">
                    <span className="text-teal-500 font-medium">$</span>
                    {clinicSettings ? formatCurrency(clinicSettings.consultationFeeDefault) : '$0.00'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Horario de Atención</span>
                  <span className="text-foreground font-medium text-sm">
                    {clinicSettings && (clinicSettings.hoursOfOperation as Record<string, string>)?.open 
                      ? `${(clinicSettings.hoursOfOperation as Record<string, string>).open} - ${(clinicSettings.hoursOfOperation as Record<string, string>).close}`
                      : '08:00 - 17:00'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Intervalo de Receso</span>
                  <span className="text-foreground text-sm">
                    {clinicSettings?.doctorBreakTimeMinutes ?? 15} min
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border border-amber-500/10 shadow-lg relative overflow-hidden p-6 md:p-8 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3 border-b pb-3 border-border/20">
                <Shield className="size-6 text-amber-500" />
                Cumplimiento Legal Sanitario
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                De acuerdo con la legislación de la República de Nicaragua, toda clínica debe mantener su documentación legal debidamente actualizada y aprobada.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-xs text-muted-foreground">Licencia MINSA:</span>
                  <span className="text-xs font-bold text-white">Requerido (Vigente)</span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-xs text-muted-foreground">Cédula RUC / Registro:</span>
                  <span className="text-xs font-bold text-white">Requerido (Vigente)</span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-xs text-muted-foreground">Estado de Acreditación:</span>
                  <span className={cn(
                    "text-xs font-bold",
                    user?.verification_status === 'approved' && "text-emerald-500 dark:text-emerald-400",
                    user?.verification_status === 'submitted' && "text-sky-500 dark:text-sky-400",
                    user?.verification_status === 'rejected' && "text-red-500 dark:text-red-400",
                    (!user?.verification_status || user?.verification_status === 'pending') && "text-amber-500 dark:text-amber-400"
                  )}>
                    {user?.verification_status === 'approved' ? 'Aprobado' :
                     user?.verification_status === 'submitted' ? 'En revisión' :
                     user?.verification_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-compliance-modal'))}
              className="glass-btn-primary w-full rounded-full text-xs font-bold py-3 mt-4"
            >
              Cargar / Re-subir Expediente Legal
            </Button>
          </GlassCard>
        </div>

        {/* Modal de Configuración y Edición de Sede (Clinic Admin) */}
        <Dialog open={isEditSettingsOpen} onOpenChange={setIsEditSettingsOpen}>
          <DialogContent className="glass border border-white/10 rounded-3xl max-w-lg shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Editar Sede y Configuración</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Actualiza los datos de contacto y parámetros operativos de tu sede.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Dirección Física de la Clínica
                </label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Ej: Frente al Parque Central, León"
                  className="glass-input rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Teléfono de Contacto
                </label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Ej: +505 8888-8888"
                  className="glass-input rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Tarifa de Consulta ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    placeholder="0.00"
                    className="glass-input rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Intervalo de Receso (min)
                  </label>
                  <select 
                    className="glass-input rounded-xl w-full h-10 px-3 text-sm bg-background border border-border"
                    value={clinicSettings?.doctorBreakTimeMinutes ?? 15}
                    onChange={async (e) => {
                      try {
                        await updateClinicSettings.mutateAsync({
                          doctorBreakTimeMinutes: parseInt(e.target.value, 10)
                        });
                        setNotification({ type: 'success', message: 'Intervalo de descanso actualizado' });
                      } catch (err) {
                        setNotification({ type: 'error', message: 'No se pudo actualizar el intervalo' });
                      }
                    }}
                  >
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Hora de Apertura
                  </label>
                  <Input
                    type="time"
                    value={editOpenTime}
                    onChange={(e) => setEditOpenTime(e.target.value)}
                    className="glass-input rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Hora de Cierre
                  </label>
                  <Input
                    type="time"
                    value={editCloseTime}
                    onChange={(e) => setEditCloseTime(e.target.value)}
                    className="glass-input rounded-xl"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsEditSettingsOpen(false)}
                className="rounded-full text-xs font-bold"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveSettings}
                className="glass-btn-primary rounded-full text-xs font-bold px-6"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin animate-duration-1000" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          <h1 className="text-2xl font-bold text-foreground">Clínicas</h1>
          <p className="text-sm text-muted-foreground">Gestiona las clínicas del sistema</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="glass-btn-primary rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="size-4" />
          Nueva Clínica
        </motion.button>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nombre o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input rounded-full pl-10 pr-4 py-2.5 h-auto text-sm"
        />
      </motion.div>

      {/* Clinics Table */}
      <AnimatePresence mode="wait">
        {clinics.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center py-12 text-center"
          >
            <Building2 className="size-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Sin clínicas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No se encontraron clínicas. Crea una nueva para comenzar.
            </p>
            <button
              onClick={handleOpenCreate}
              className="glass-btn-primary rounded-full px-6 py-2 text-sm font-medium"
            >
              Nueva Clínica
            </button>
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
                    <TableHead className="text-muted-foreground">Clínica</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Dirección</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Teléfono</TableHead>
                    <TableHead className="text-muted-foreground">Estado</TableHead>
                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.map((clinic, i) => (
                    <motion.tr
                      key={clinic.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-border/30 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                            <Building2 className="size-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <span className="font-medium text-foreground">{clinic.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground max-w-[200px] truncate">
                          <MapPin className="size-3.5 shrink-0" />
                          {clinic.address}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {clinic.phone ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />
                            {clinic.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            (clinic.isActive ?? clinic.is_active)
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400',
                          )}
                        >
                          {(clinic.isActive ?? clinic.is_active) ? 'Activa' : 'Inactiva'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenEdit(clinic)}
                          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-teal-500/10 transition-colors"
                        >
                          <Pencil className="size-3.5 text-teal-600 dark:text-teal-400" />
                        </motion.button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingClinic ? 'Editar Clínica' : 'Nueva Clínica'}</DialogTitle>
            <DialogDescription>
              {editingClinic ? 'Modifica los datos de la clínica' : 'Ingresa los datos de la nueva clínica'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input
                placeholder="Nombre de la clínica"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Dirección *</label>
              <Input
                placeholder="Dirección completa"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Coordenadas Geográficas (GPS) *</label>
                <button
                  type="button"
                  onClick={detectGPS}
                  disabled={isDetecting}
                  className="text-xs font-black text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition-all focus:outline-none"
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Detectando...
                    </>
                  ) : (
                    <>
                      <MapPin className="size-3 text-teal-500 animate-bounce" />
                      Autodetectar GPS
                    </>
                  )}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-medium">Latitud</span>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ej: 12.1364"
                    value={form.latitude}
                    onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                    className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-medium">Longitud</span>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ej: -86.2514"
                    value={form.longitude}
                    onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                    className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Teléfono</label>
              <Input
                placeholder="+52 555 123 4567"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Dueño / Administrador de Clínica</label>
              <select
                value={form.ownerId}
                onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm w-full bg-background/50 border border-border/40 text-foreground"
              >
                <option value="">-- Sin Dueño Asignado --</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between p-3 glass rounded-2xl border border-border/20">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Estado de la Clínica</span>
                <span className="text-xs text-muted-foreground">Determina si está activa y operativa</span>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="size-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
              className="glass-btn-secondary rounded-full px-5 py-2 text-sm font-medium h-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="glass-btn-primary rounded-full px-5 py-2 text-sm font-medium h-auto flex items-center gap-2"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingClinic ? 'Guardar cambios' : 'Crear clínica'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
