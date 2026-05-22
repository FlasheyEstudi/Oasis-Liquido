'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useClinicWorkers,
  usePharmacyWorkers,
  useInviteDoctor,
  useInviteReceptionist,
  useInviteCashier,
  useInviteDriver,
  useChangeWorkerStatus,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { GlassCard } from '@/components/oasis/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Users,
  Mail,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Stethoscope,
  KeyRound,
  Truck,
  UserCheck,
  Building,
  Store,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CLINIC STAFF MANAGEMENT COMPONENT ---
export function ClinicStaffManagement({ clinicId }: { clinicId: string }) {
  const { setNotification } = useAuthStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor');

  const { data, isLoading, error, refetch } = useClinicWorkers(clinicId);
  const inviteDoctor = useInviteDoctor();
  const inviteReceptionist = useInviteReceptionist();
  const changeWorkerStatus = useChangeWorkerStatus();

  const doctors = data?.doctors || [];
  const receptionists = data?.receptionists || [];
  const isInviting = inviteDoctor.isPending || inviteReceptionist.isPending;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setNotification({ type: 'warning', message: 'Por favor, introduce un correo electrónico válido' });
      return;
    }

    try {
      if (role === 'doctor') {
        await inviteDoctor.mutateAsync(
          { clinicId, email: email.trim() },
          {
            onSuccess: () => {
              setNotification({ type: 'success', message: 'Invitación enviada al Doctor con éxito' });
              setEmail('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al enviar invitación' });
            },
          }
        );
      } else {
        await inviteReceptionist.mutateAsync(
          { clinicId, email: email.trim() },
          {
            onSuccess: () => {
              setNotification({ type: 'success', message: 'Invitación enviada al Recepcionista con éxito' });
              setEmail('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al enviar invitación' });
            },
          }
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (workerId: string, currentStatus: boolean) => {
    try {
      await changeWorkerStatus.mutateAsync(
        { workerId, isActive: !currentStatus },
        {
          onSuccess: () => {
            setNotification({
              type: 'success',
              message: `Trabajador ${!currentStatus ? 'activado' : 'desactivado'} con éxito`,
            });
            refetch();
          },
          onError: (err) => {
            setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al cambiar estado' });
          },
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Invite form */}
      <GlassCard className="overflow-hidden border border-teal-500/10 shadow-lg relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-teal-500/10">
            <UserPlus className="size-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Contratar y Reclutar Personal</h3>
            <p className="text-xs text-muted-foreground">Envía un enlace de invitación para registrarse en el sistema</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-3 items-end">
          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="size-3.5 text-teal-500" />
              Rol de Negocio
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="glass-input w-full h-11 px-4 rounded-xl text-sm text-foreground focus:outline-none appearance-none bg-transparent pr-8"
              >
                <option value="doctor" className="bg-slate-800 text-white">Médico / Doctor</option>
                <option value="receptionist" className="bg-slate-800 text-white">Recepcionista</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-teal-500" />
              Correo Electrónico
            </label>
            <Input
              type="email"
              placeholder="doctor@oasis.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
            />
          </div>

          <Button
            type="submit"
            disabled={isInviting}
            className="glass-btn-primary rounded-xl h-11 font-semibold flex items-center justify-center gap-2"
          >
            {isInviting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Enviar Invitación
              </>
            )}
          </Button>
        </form>
      </GlassCard>

      {/* Staff listing */}
      <GlassCard className="!p-0 border border-teal-500/10 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-teal-500/10">
              <Users className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Personal de la Clínica</h3>
              <p className="text-xs text-muted-foreground">Médicos y recepcionistas contratados en tu clínica</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex size-9 items-center justify-center rounded-full bg-muted/50 hover:bg-teal-500/10 transition-colors text-muted-foreground hover:text-teal-600"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-teal-500" />
            <p className="text-sm text-muted-foreground">Cargando personal...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-500 mb-2">No se pudo cargar el personal</p>
            <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-4 py-1.5 text-xs">
              Reintentar
            </button>
          </div>
        ) : doctors.length === 0 && receptionists.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="size-12 text-muted-foreground/30 mb-3" />
            <h4 className="text-base font-semibold mb-1">Sin personal asignado</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Aún no tienes trabajadores. Utiliza el formulario superior para contratar a tus primeros empleados.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground">Rol</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">Especialidad / Licencia</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Doctors */}
              {doctors.map((worker) => (
                <TableRow key={worker.id} className="border-border/30 hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                        <Stethoscope className="size-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block text-sm">{worker.name}</span>
                        <span className="text-xs text-muted-foreground block">{worker.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      Médico
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div>
                      <span className="block text-xs font-medium text-foreground">
                        {worker.doctor_profile?.specialty || 'General'}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        Cédula: {worker.doctor_profile?.license_number || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        worker.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {worker.is_active ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleToggleStatus(worker.id, worker.is_active)}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-teal-500 transition-colors"
                      title={worker.is_active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {worker.is_active ? (
                        <ToggleRight className="size-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="size-6" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Receptionists */}
              {receptionists.map((worker) => (
                <TableRow key={worker.id} className="border-border/30 hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500/10">
                        <UserCheck className="size-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block text-sm">{worker.name}</span>
                        <span className="text-xs text-muted-foreground block">{worker.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      Recepcionista
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">—</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        worker.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {worker.is_active ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleToggleStatus(worker.id, worker.is_active)}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-teal-500 transition-colors"
                      title={worker.is_active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {worker.is_active ? (
                        <ToggleRight className="size-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="size-6" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </div>
  );
}

// --- PHARMACY STAFF MANAGEMENT COMPONENT ---
export function PharmacyStaffManagement({ pharmacyId }: { pharmacyId: string }) {
  const { setNotification } = useAuthStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'cashier' | 'delivery_driver'>('cashier');

  const { data, isLoading, error, refetch } = usePharmacyWorkers(pharmacyId);
  const inviteCashier = useInviteCashier();
  const inviteDriver = useInviteDriver();
  const changeWorkerStatus = useChangeWorkerStatus();

  const cashiers = data?.cashiers || [];
  const drivers = data?.drivers || [];
  const isInviting = inviteCashier.isPending || inviteDriver.isPending;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setNotification({ type: 'warning', message: 'Por favor, introduce un correo electrónico válido' });
      return;
    }

    try {
      if (role === 'cashier') {
        await inviteCashier.mutateAsync(
          { pharmacyId, email: email.trim() },
          {
            onSuccess: () => {
              setNotification({ type: 'success', message: 'Invitación enviada al Cajero con éxito' });
              setEmail('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al enviar invitación' });
            },
          }
        );
      } else {
        await inviteDriver.mutateAsync(
          { pharmacyId, email: email.trim() },
          {
            onSuccess: () => {
              setNotification({ type: 'success', message: 'Invitación enviada al Repartidor con éxito' });
              setEmail('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al enviar invitación' });
            },
          }
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (workerId: string, currentStatus: boolean) => {
    try {
      await changeWorkerStatus.mutateAsync(
        { workerId, isActive: !currentStatus },
        {
          onSuccess: () => {
            setNotification({
              type: 'success',
              message: `Trabajador ${!currentStatus ? 'activado' : 'desactivado'} con éxito`,
            });
            refetch();
          },
          onError: (err) => {
            setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al cambiar estado' });
          },
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Invite form */}
      <GlassCard className="overflow-hidden border border-sky-500/10 shadow-lg relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-sky-500/10">
            <UserPlus className="size-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Contratar y Reclutar Personal</h3>
            <p className="text-xs text-muted-foreground">Envía un enlace de invitación para registrarse en el sistema de farmacia</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-3 items-end">
          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="size-3.5 text-sky-500" />
              Rol de Negocio
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="glass-input w-full h-11 px-4 rounded-xl text-sm text-foreground focus:outline-none appearance-none bg-transparent pr-8"
              >
                <option value="cashier" className="bg-slate-800 text-white">Cajero</option>
                <option value="delivery_driver" className="bg-slate-800 text-white">Repartidor (Delivery)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-sky-500" />
              Correo Electrónico
            </label>
            <Input
              type="email"
              placeholder="empleado@oasis.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
            />
          </div>

          <Button
            type="submit"
            disabled={isInviting}
            className="glass-btn-primary rounded-xl h-11 font-semibold flex items-center justify-center gap-2"
          >
            {isInviting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Enviar Invitación
              </>
            )}
          </Button>
        </form>
      </GlassCard>

      {/* Staff listing */}
      <GlassCard className="!p-0 border border-sky-500/10 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-sky-500/10">
              <Users className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Personal de la Farmacia</h3>
              <p className="text-xs text-muted-foreground">Cajeros y repartidores de delivery asignados</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex size-9 items-center justify-center rounded-full bg-muted/50 hover:bg-sky-500/10 transition-colors text-muted-foreground hover:text-sky-600"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-sky-500" />
            <p className="text-sm text-muted-foreground">Cargando personal...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-500 mb-2">No se pudo cargar el personal</p>
            <button onClick={() => refetch()} className="glass-btn-secondary rounded-full px-4 py-1.5 text-xs">
              Reintentar
            </button>
          </div>
        ) : cashiers.length === 0 && drivers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="size-12 text-muted-foreground/30 mb-3" />
            <h4 className="text-base font-semibold mb-1">Sin personal asignado</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Aún no tienes trabajadores. Utiliza el formulario superior para contratar a tus primeros empleados.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground">Rol</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">Detalles del Perfil</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Cashiers */}
              {cashiers.map((worker) => (
                <TableRow key={worker.id} className="border-border/30 hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                        <KeyRound className="size-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block text-sm">{worker.name}</span>
                        <span className="text-xs text-muted-foreground block">{worker.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      Cajero
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">—</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        worker.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {worker.is_active ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleToggleStatus(worker.id, worker.is_active)}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title={worker.is_active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {worker.is_active ? (
                        <ToggleRight className="size-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="size-6" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Drivers */}
              {drivers.map((worker) => (
                <TableRow key={worker.id} className="border-border/30 hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                        <Truck className="size-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block text-sm">{worker.name}</span>
                        <span className="text-xs text-muted-foreground block">{worker.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      Repartidor
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    Vehículo: {worker.delivery_driver_profile?.vehicle_type || 'Motocicleta'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        worker.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {worker.is_active ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleToggleStatus(worker.id, worker.is_active)}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title={worker.is_active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {worker.is_active ? (
                        <ToggleRight className="size-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="size-6" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </div>
  );
}
