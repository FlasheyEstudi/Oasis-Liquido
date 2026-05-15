'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useClinics,
  useCreateClinic,
  useUpdateClinic,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { Clinic } from '@/types';
import { GlassCard } from '@/components/oasis/glass-card';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ClinicFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
}

const emptyForm: ClinicFormData = {
  name: '',
  address: '',
  latitude: '19.4326',
  longitude: '-99.1332',
  phone: '',
};

export function ManageClinics() {
  const { setNotification } = useAuthStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [form, setForm] = useState<ClinicFormData>(emptyForm);

  const {
    data: clinicsResult,
    isLoading,
    error,
    refetch,
  } = useClinics({ search: search || undefined });

  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();

  const clinics = clinicsResult?.data ?? [];
  const isSaving = createClinic.isPending || updateClinic.isPending;

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
      latitude: parseFloat(form.latitude) || 19.4326,
      longitude: parseFloat(form.longitude) || -99.1332,
      phone: form.phone.trim() || undefined,
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
                            clinic.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400',
                          )}
                        >
                          {clinic.is_active ? 'Activa' : 'Inactiva'}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Latitud</label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Longitud</label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
                />
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
