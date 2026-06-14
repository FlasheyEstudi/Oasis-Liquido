'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  usePharmacies,
  useCreatePharmacy,
  useUpdatePharmacy,
  useUsers,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { Pharmacy } from '@/types';
import { GlassCard } from '@/components/oasis/glass-card';
import { PharmacyStaffManagement } from '../common/staff-management';
import { MinsaComplianceReport } from '../common/minsa-compliance-report';
import { CashReconciliation } from '../common/cash-reconciliation';
import {
  InventoryVelocityChart,
  StockExpiryTimeline,
  DemandForecastSparklines,
  DriverEfficiencyBubble,
  SalesMicroAnimationCards,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pill,
  Plus,
  Search,
  Pencil,
  Phone,
  MapPin,
  Loader2,
  Activity,
  Store,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PharmacyFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  ownerId: string;
  isActive: boolean;
}

const emptyForm: PharmacyFormData = {
  name: '',
  address: '',
  latitude: '12.1364',
  longitude: '-86.2514',
  phone: '',
  ownerId: '',
  isActive: true,
};

export function ManagePharmacies() {
  const { user, setNotification, currentPage } = useAuthStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [form, setForm] = useState<PharmacyFormData>(emptyForm);
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

  // For pharmacy_admin, filter by their own user ID to avoid pagination misses
  const isPharmacyOwner = user?.role === 'pharmacy_admin';
  const pharmacyQueryParams = isPharmacyOwner
    ? { owner_id: user?.id, search: search || undefined }
    : { search: search || undefined };

  const {
    data: pharmaciesResult,
    isLoading,
    error,
    refetch,
  } = usePharmacies(pharmacyQueryParams);

  const { data: ownersResult } = useUsers({ role: 'pharmacy_admin' });
  const owners = ownersResult?.data ?? [];

  const createPharmacy = useCreatePharmacy();
  const updatePharmacy = useUpdatePharmacy();

  const pharmacies = pharmaciesResult?.data ?? [];
  const isSaving = createPharmacy.isPending || updatePharmacy.isPending;

  const handleOpenCreate = () => {
    setEditingPharmacy(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (pharmacy: Pharmacy) => {
    setEditingPharmacy(pharmacy);
    setForm({
      name: pharmacy.name,
      address: pharmacy.address,
      latitude: String(pharmacy.latitude),
      longitude: String(pharmacy.longitude),
      phone: pharmacy.phone || '',
      ownerId: pharmacy.ownerId || pharmacy.owner_id || '',
      isActive: pharmacy.isActive ?? pharmacy.is_active ?? true,
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

    if (editingPharmacy) {
      updatePharmacy.mutate(
        { id: editingPharmacy.id, data },
        {
          onSuccess: () => {
            setNotification({ type: 'success', message: 'Farmacia actualizada' });
            setDialogOpen(false);
          },
          onError: () => {
            setNotification({ type: 'error', message: 'No se pudo actualizar la farmacia' });
          },
        },
      );
    } else {
      createPharmacy.mutate(data, {
        onSuccess: () => {
          setNotification({ type: 'success', message: 'Farmacia creada' });
          setDialogOpen(false);
        },
        onError: () => {
          setNotification({ type: 'error', message: 'No se pudo crear la farmacia' });
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
          {getHookErrorMessage(error) || 'No se pudieron cargar las farmacias'}
        </p>
        <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-6 py-2 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  const ownedPharmacy = pharmacies.find(
    (p) => p.ownerId === user?.id || p.owner_id === user?.id
  );

  if (isPharmacyOwner) {
    if (!ownedPharmacy) {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <GlassCard className="text-center py-16">
            <Store className="size-16 text-sky-500/40 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sin Farmacia Asignada</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Actualmente no tienes ninguna farmacia asociada a tu cuenta. Contacta con el equipo de soporte de OASIS para vincular tu farmacia.
            </p>
          </GlassCard>
        </div>
      );
    }

    if (currentPage === 'pharmacy-minsa') {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 print:hidden"
          >
            <h1 className="text-2xl font-bold text-foreground">Reportes de Cumplimiento MINSA</h1>
            <p className="text-sm text-muted-foreground">Libro Oficial de Control de Psicotrópicos y Estupefacientes en tiempo real</p>
          </motion.div>
          <div>
            <MinsaComplianceReport facilityId={ownedPharmacy.id} type="pharmacy" />
          </div>
        </div>
      );
    }

    if (currentPage === 'pharmacy-staff') {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-2xl font-bold text-foreground">Gestión de Personal</h1>
            <p className="text-sm text-muted-foreground">Invita y administra cajeros, repartidores y personal de la farmacia</p>
          </motion.div>
          <div>
            <PharmacyStaffManagement pharmacyId={ownedPharmacy.id} />
          </div>
        </div>
      );
    }

    if (currentPage === 'pharmacy-finances') {
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
            <CashReconciliation entityId={ownedPharmacy.id} type="pharmacies" />
          </div>
        </div>
      );
    }

    if (currentPage === 'pharmacy-analytics') {
      return (
        <div className="space-y-6 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-2xl font-bold text-foreground">Analíticas y KPIs de Farmacia</h1>
            <p className="text-sm text-muted-foreground">Métricas en tiempo real y predictivas para control de inventario y ventas</p>
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SalesMicroAnimationCards />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <InventoryVelocityChart />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <DemandForecastSparklines />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
              <DriverEfficiencyBubble />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1">
              <StockExpiryTimeline />
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
          <p className="text-sm text-muted-foreground">Detalles de ubicación, contacto y estado físico de tu farmacia</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
          <GlassCard className="border border-sky-500/10 shadow-lg relative overflow-hidden p-6 md:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3 border-b pb-3 border-border/20">
              <Store className="size-6 text-sky-500" />
              Sede Registrada
            </h3>
            
            <div className="space-y-6 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium mb-1">Nombre de la Farmacia</span>
                  <span className="text-foreground font-bold text-lg">{ownedPharmacy.name}</span>
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
                  <MapPin className="size-5 text-sky-500 shrink-0 mt-0.5" />
                  {ownedPharmacy.address}
                </span>
              </div>

              {ownedPharmacy.phone && (
                <div>
                  <span className="text-xs text-muted-foreground block font-medium mb-1">Teléfono de Contacto</span>
                  <span className="text-foreground flex items-center gap-2 text-base">
                    <Phone className="size-5 text-sky-500 shrink-0" />
                    {ownedPharmacy.phone}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Coordenada de Latitud</span>
                  <span className="text-foreground font-mono text-sm">{ownedPharmacy.latitude}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Coordenada de Longitud</span>
                  <span className="text-foreground font-mono text-sm">{ownedPharmacy.longitude}</span>
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
                De acuerdo con la legislación de la República de Nicaragua, toda farmacia autorizada debe mantener su documentación legal debidamente actualizada y aprobada.
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
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
        <GlassCard className="text-center p-8 max-w-md border border-rose-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <Shield className="size-16 text-rose-500/50 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-foreground mb-2">Acceso Restringido</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No tienes los privilegios necesarios para ver o modificar el listado global de farmacias del sistema.
          </p>
        </GlassCard>
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
          <h1 className="text-2xl font-bold text-foreground">Farmacias</h1>
          <p className="text-sm text-muted-foreground">Gestiona las farmacias del sistema</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="glass-btn-primary rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="size-4" />
          Nueva Farmacia
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

      {/* Pharmacies Table */}
      <AnimatePresence mode="wait">
        {pharmacies.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center py-12 text-center"
          >
            <Pill className="size-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Sin farmacias</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No se encontraron farmacias. Crea una nueva para comenzar.
            </p>
            <button
              onClick={handleOpenCreate}
              className="glass-btn-primary rounded-full px-6 py-2 text-sm font-medium"
            >
              Nueva Farmacia
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
                    <TableHead className="text-muted-foreground">Farmacia</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Dirección</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Teléfono</TableHead>
                    <TableHead className="text-muted-foreground">Estado</TableHead>
                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pharmacies.map((pharmacy, i) => (
                    <motion.tr
                      key={pharmacy.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-border/30 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10">
                            <Pill className="size-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <span className="font-medium text-foreground">{pharmacy.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground max-w-[200px] truncate">
                          <MapPin className="size-3.5 shrink-0" />
                          {pharmacy.address}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pharmacy.phone ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />
                            {pharmacy.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            (pharmacy.isActive ?? pharmacy.is_active)
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400',
                          )}
                        >
                          {(pharmacy.isActive ?? pharmacy.is_active) ? 'Activa' : 'Inactiva'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenEdit(pharmacy)}
                          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-sky-500/10 transition-colors"
                        >
                          <Pencil className="size-3.5 text-sky-600 dark:text-sky-400" />
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
            <DialogTitle>{editingPharmacy ? 'Editar Farmacia' : 'Añadir Farmacia'}</DialogTitle>
            <DialogDescription>
              {editingPharmacy ? 'Modifica los detalles de la farmacia.' : 'Registra una nueva farmacia en la red OASIS.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input
                placeholder="Nombre de la farmacia"
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
              <label className="text-sm font-medium text-foreground">Dueño / Administrador de Farmacia</label>
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
                <span className="text-sm font-medium text-foreground">Estado de la Farmacia</span>
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
              {editingPharmacy ? 'Guardar cambios' : 'Crear farmacia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
