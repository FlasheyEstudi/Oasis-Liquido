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
  useUpdateWorker,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Users,
  User,
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
  Plus,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CLINIC STAFF MANAGEMENT COMPONENT ---
export function ClinicStaffManagement({ clinicId }: { clinicId: string }) {
  const { setNotification } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor');
  const [specialty, setSpecialty] = useState('Medicina General');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [editingWorker, setEditingWorker] = useState<any | null>(null);

  const { data, isLoading, error, refetch } = useClinicWorkers(clinicId);
  const inviteDoctor = useInviteDoctor();
  const inviteReceptionist = useInviteReceptionist();
  const changeWorkerStatus = useChangeWorkerStatus();

  const doctors = data?.doctors || [];
  const receptionists = data?.receptionists || [];
  const isCreating = inviteDoctor.isPending || inviteReceptionist.isPending;

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setNotification({ type: 'warning', message: 'Por favor, completa Nombre, Email y Contraseña' });
      return;
    }

    try {
      if (role === 'doctor') {
        await inviteDoctor.mutateAsync(
          {
            clinicId,
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim() || undefined,
            password: password.trim(),
            specialty: specialty.trim(),
            licenseNumber: licenseNumber.trim() || undefined,
          } as any,
          {
            onSuccess: () => {
              setNotification({
                type: 'success',
                message: 'Doctor creado y vinculado con éxito. 14 días para que el empleado suba sus documentos.',
              });
              setName('');
              setEmail('');
              setPhone('');
              setPassword('');
              setLicenseNumber('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al crear doctor' });
            },
          }
        );
      } else {
        await inviteReceptionist.mutateAsync(
          {
            clinicId,
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim() || undefined,
            password: password.trim(),
          } as any,
          {
            onSuccess: () => {
              setNotification({
                type: 'success',
                message: 'Recepcionista creado y vinculado con éxito. 14 días para subir documentos legales.',
              });
              setName('');
              setEmail('');
              setPhone('');
              setPassword('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al crear recepcionista' });
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
        { workerId, isActive: !currentStatus, clinicId },
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
      {/* Employee creation form */}
      <GlassCard className="overflow-hidden border border-teal-500/10 shadow-lg relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-teal-500/10">
            <UserPlus className="size-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Crear y Contratar Empleado</h3>
            <p className="text-xs text-muted-foreground">Registra inmediatamente al personal y vincúlalo a tu clínica</p>
          </div>
        </div>

        <form onSubmit={handleCreateEmployee} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-teal-500" />
                Rol de Negocio *
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-teal-500" />
                Nombre Completo *
              </label>
              <Input
                type="text"
                placeholder="Dr. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-teal-500" />
                Correo Electrónico *
              </label>
              <Input
                type="email"
                placeholder="doctor@oasis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-teal-500" />
                Contraseña Inicial *
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-teal-500" />
                Celular / Teléfono
              </label>
              <Input
                type="text"
                placeholder="+505 8888-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
              />
            </div>

            {role === 'doctor' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Stethoscope className="size-3.5 text-teal-500" />
                    Especialidad *
                  </label>
                  <Input
                    type="text"
                    placeholder="Pediatría, Cardiología..."
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building className="size-3.5 text-teal-500" />
                    Código / Licencia MINSA *
                  </label>
                  <Input
                    type="text"
                    placeholder="MINSA-12345"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 text-xs text-teal-600 dark:text-teal-400 flex items-start gap-2.5">
            <UserCheck className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Política de Cumplimiento Legal (Cumplimiento de 14 días)</p>
              <p className="mt-0.5 opacity-90">
                Al crear la cuenta del personal, el sistema le otorgará automáticamente un plazo de 14 días para cargar sus documentos médicos y legales (Cédula, RUC, Título de especialidad, etc.) en su propio perfil. De lo contrario, su cuenta quedará suspendida temporalmente por auditoría.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isCreating}
              className="glass-btn-primary rounded-xl h-11 px-8 font-semibold flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando Empleado...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Contratar y Crear Cuenta
                </>
              )}
            </Button>
          </div>
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
                        (worker.isActive ?? worker.is_active)
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {(worker.isActive ?? worker.is_active) ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingWorker(worker)}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title="Editar Datos"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(worker.id, !!(worker.isActive ?? worker.is_active))}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-teal-500 transition-colors"
                      title={(worker.isActive ?? worker.is_active) ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {(worker.isActive ?? worker.is_active) ? (
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
                        (worker.isActive ?? worker.is_active)
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {(worker.isActive ?? worker.is_active) ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingWorker(worker)}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title="Editar Datos"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(worker.id, !!(worker.isActive ?? worker.is_active))}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-teal-500 transition-colors"
                      title={(worker.isActive ?? worker.is_active) ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {(worker.isActive ?? worker.is_active) ? (
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

      {editingWorker && (
        <EditStaffModal
          isOpen={!!editingWorker}
          onClose={() => setEditingWorker(null)}
          worker={editingWorker}
          onSuccess={() => refetch()}
          clinicId={clinicId}
        />
      )}
    </div>
  );
}

// --- PHARMACY STAFF MANAGEMENT COMPONENT ---
export function PharmacyStaffManagement({ pharmacyId }: { pharmacyId: string }) {
  const { setNotification } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cashier' | 'delivery_driver'>('cashier');
  const [vehicleType, setVehicleType] = useState('motocicleta');
  const [licensePlate, setLicensePlate] = useState('');
  const [editingWorker, setEditingWorker] = useState<any | null>(null);

  const { data, isLoading, error, refetch } = usePharmacyWorkers(pharmacyId);
  const inviteCashier = useInviteCashier();
  const inviteDriver = useInviteDriver();
  const changeWorkerStatus = useChangeWorkerStatus();

  const cashiers = data?.cashiers || [];
  const drivers = data?.drivers || [];
  const isCreating = inviteCashier.isPending || inviteDriver.isPending;

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setNotification({ type: 'warning', message: 'Por favor, completa Nombre, Email y Contraseña' });
      return;
    }

    try {
      if (role === 'cashier') {
        await inviteCashier.mutateAsync(
          {
            pharmacyId,
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim() || undefined,
            password: password.trim(),
          } as any,
          {
            onSuccess: () => {
              setNotification({
                type: 'success',
                message: 'Cajero creado y vinculado con éxito. 14 días para completar perfil.',
              });
              setName('');
              setEmail('');
              setPhone('');
              setPassword('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al crear cajero' });
            },
          }
        );
      } else {
        await inviteDriver.mutateAsync(
          {
            pharmacyId,
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim() || undefined,
            password: password.trim(),
            vehicleType,
            licensePlate: licensePlate.trim() || undefined,
          } as any,
          {
            onSuccess: () => {
              setNotification({
                type: 'success',
                message: 'Repartidor creado y vinculado con éxito. Plazo de 14 días para documentos.',
              });
              setName('');
              setEmail('');
              setPhone('');
              setPassword('');
              setLicensePlate('');
              refetch();
            },
            onError: (err) => {
              setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al crear repartidor' });
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
        { workerId, isActive: !currentStatus, pharmacyId },
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
      {/* Employee creation form */}
      <GlassCard className="overflow-hidden border border-sky-500/10 shadow-lg relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-sky-500/10">
            <UserPlus className="size-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Crear y Contratar Personal</h3>
            <p className="text-xs text-muted-foreground">Registra inmediatamente al personal y vincúlalo a tu farmacia</p>
          </div>
        </div>

        <form onSubmit={handleCreateEmployee} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-sky-500" />
                Rol de Negocio *
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-sky-500" />
                Nombre Completo *
              </label>
              <Input
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-sky-500" />
                Correo Electrónico *
              </label>
              <Input
                type="email"
                placeholder="empleado@oasis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-sky-500" />
                Contraseña Inicial *
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-sky-500" />
                Celular / Teléfono
              </label>
              <Input
                type="text"
                placeholder="+505 8888-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
              />
            </div>

            {role === 'delivery_driver' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Truck className="size-3.5 text-sky-500" />
                    Tipo de Vehículo
                  </label>
                  <div className="relative">
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="glass-input w-full h-11 px-4 rounded-xl text-sm text-foreground focus:outline-none appearance-none bg-transparent pr-8"
                    >
                      <option value="motocicleta" className="bg-slate-800 text-white">Motocicleta</option>
                      <option value="automovil" className="bg-slate-800 text-white">Automóvil</option>
                      <option value="bicicleta" className="bg-slate-800 text-white">Bicicleta / A pie</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building className="size-3.5 text-sky-500" />
                    Placa del Vehículo
                  </label>
                  <Input
                    type="text"
                    placeholder="M 12345"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="glass-input rounded-xl px-4 py-2.5 h-11 text-sm placeholder:text-muted-foreground/50"
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 text-xs text-sky-600 dark:text-sky-400 flex items-start gap-2.5">
            <UserCheck className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cumplimiento Técnico (Período de Documentos)</p>
              <p className="mt-0.5 opacity-90">
                Al dar de alta a este personal de farmacia, el sistema lo vinculará directamente a tu inventario y roles de entrega. Cuentan con un período de gracia legal de 14 días para adjuntar su identificación fiscal y licencia de conducir.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isCreating}
              className="glass-btn-primary rounded-xl h-11 px-8 font-semibold flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando Personal...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Dar de Alta y Crear Cuenta
                </>
              )}
            </Button>
          </div>
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
                        (worker.isActive ?? worker.is_active)
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {(worker.isActive ?? worker.is_active) ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingWorker(worker)}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title="Editar Datos"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(worker.id, !!(worker.isActive ?? worker.is_active))}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title={(worker.isActive ?? worker.is_active) ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {(worker.isActive ?? worker.is_active) ? (
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
                        (worker.isActive ?? worker.is_active)
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {(worker.isActive ?? worker.is_active) ? 'Activo' : 'Desactivado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingWorker(worker)}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title="Editar Datos"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(worker.id, !!(worker.isActive ?? worker.is_active))}
                      disabled={changeWorkerStatus.isPending}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-sky-500 transition-colors"
                      title={(worker.isActive ?? worker.is_active) ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    >
                      {(worker.isActive ?? worker.is_active) ? (
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

      {editingWorker && (
        <EditStaffModal
          isOpen={!!editingWorker}
          onClose={() => setEditingWorker(null)}
          worker={editingWorker}
          onSuccess={() => refetch()}
          pharmacyId={pharmacyId}
        />
      )}
    </div>
  );
}

import { useEffect } from 'react';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: any;
  onSuccess: () => void;
  clinicId?: string;
  pharmacyId?: string;
}

export function EditStaffModal({ isOpen, onClose, worker, onSuccess, clinicId, pharmacyId }: EditStaffModalProps) {
  const { setNotification } = useAuthStore();
  const [name, setName] = useState(worker?.name || '');
  const [phone, setPhone] = useState(worker?.phone || '');
  const [specialty, setSpecialty] = useState(worker?.doctorProfile?.specialty || worker?.doctor_profile?.specialty || '');
  const [licenseNumber, setLicenseNumber] = useState(worker?.doctorProfile?.licenseNumber || worker?.doctor_profile?.license_number || '');
  const [vehicleType, setVehicleType] = useState(worker?.deliveryDriverProfile?.vehicleType || worker?.delivery_driver_profile?.vehicle_type || 'motocicleta');
  const [licensePlate, setLicensePlate] = useState(worker?.deliveryDriverProfile?.licensePlate || worker?.delivery_driver_profile?.license_plate || '');

  const updateWorker = useUpdateWorker();

  // Reset fields when worker changes
  useEffect(() => {
    if (worker) {
      setName(worker.name || '');
      setPhone(worker.phone || '');
      setSpecialty(worker.doctorProfile?.specialty || worker.doctor_profile?.specialty || '');
      setLicenseNumber(worker.doctorProfile?.licenseNumber || worker.doctor_profile?.license_number || '');
      setVehicleType(worker.deliveryDriverProfile?.vehicleType || worker.delivery_driver_profile?.vehicle_type || 'motocicleta');
      setLicensePlate(worker.deliveryDriverProfile?.licensePlate || worker.delivery_driver_profile?.license_plate || '');
    }
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ type: 'warning', message: 'El nombre es requerido' });
      return;
    }

    try {
      await updateWorker.mutateAsync({
        workerId: worker.id,
        clinicId,
        pharmacyId,
        data: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          specialty: worker.role === 'doctor' ? specialty.trim() : undefined,
          licenseNumber: worker.role === 'doctor' ? licenseNumber.trim() : undefined,
          vehicleType: worker.role === 'delivery_driver' ? vehicleType : undefined,
          licensePlate: worker.role === 'delivery_driver' ? licensePlate.trim() : undefined,
        }
      });
      setNotification({ type: 'success', message: 'Trabajador actualizado exitosamente' });
      onSuccess();
      onClose();
    } catch (err) {
      setNotification({ type: 'error', message: getHookErrorMessage(err) || 'Error al actualizar trabajador' });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'doctor': return 'Médico';
      case 'receptionist': return 'Recepcionista';
      case 'cashier': return 'Cajero';
      case 'delivery_driver': return 'Repartidor';
      default: return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-strong border border-white/20 rounded-3xl max-w-md w-full shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Pencil className="size-5 text-sky-500" />
            Editar {getRoleLabel(worker?.role)}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Modifica los datos del empleado y guarda los cambios en tiempo real.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nombre Completo *</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input rounded-xl h-11 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Teléfono</label>
            <Input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input rounded-xl h-11 text-sm"
              placeholder="+505 8888-8888"
            />
          </div>

          {worker?.role === 'doctor' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Especialidad</label>
                <Input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="glass-input rounded-xl h-11 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Cédula MINSA</label>
                <Input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="glass-input rounded-xl h-11 text-sm"
                />
              </div>
            </>
          )}

          {worker?.role === 'delivery_driver' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Vehículo</label>
                <div className="relative">
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="glass-input w-full h-11 px-4 rounded-xl text-sm text-foreground focus:outline-none appearance-none bg-transparent pr-8"
                  >
                    <option value="motocicleta" className="bg-slate-800 text-white">Motocicleta</option>
                    <option value="bicicleta" className="bg-slate-800 text-white">Bicicleta</option>
                    <option value="automovil" className="bg-slate-800 text-white">Automóvil</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    ▼
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Placa del Vehículo</label>
                <Input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="glass-input rounded-xl h-11 text-sm"
                  placeholder="M 12345"
                />
              </div>
            </>
          )}

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateWorker.isPending}
              className="glass-btn-primary rounded-xl px-6 py-2 text-sm font-semibold flex items-center gap-2"
            >
              {updateWorker.isPending && <Loader2 className="size-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
