'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  getHookErrorMessage,
} from '@/hooks/use-api';
import type { User, UserRole } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Mail,
  Phone,
  Loader2,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'patient',
  phone: '',
  isActive: true,
};

const ROLE_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Médicos' },
  { value: 'receptionist', label: 'Recepcionistas' },
  { value: 'patient', label: 'Pacientes' },
  { value: 'pharmacy_manager', label: 'Farmacéuticos' },
  { value: 'delivery_driver', label: 'Repartidores' },
];

export function ManageUsers() {
  const { setNotification } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 8;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);

  const {
    data: usersResult,
    isLoading,
    error,
    refetch,
  } = useUsers({
    role: roleFilter !== 'all' ? roleFilter : undefined,
    search: search || undefined,
    page,
    limit,
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = usersResult?.data ?? [];
  const total = usersResult?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const isSaving = createUser.isPending || updateUser.isPending || deleteUserMutation.isPending;

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas desactivar al usuario "${name}"?`)) {
      deleteUserMutation.mutate(id, {
        onSuccess: () => {
          setNotification({ type: 'success', message: 'Usuario desactivado exitosamente.' });
          refetch();
        },
        onError: () => {
          setNotification({ type: 'error', message: 'No se pudo desactivar al usuario.' });
        }
      });
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      isActive: user.isActive ?? user.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      setNotification({ type: 'warning', message: 'Nombre y email son obligatorios' });
      return;
    }
    if (!editingUser && !form.password.trim()) {
      setNotification({ type: 'warning', message: 'La contraseña es obligatoria para nuevos usuarios' });
      return;
    }

    if (editingUser) {
      updateUser.mutate(
        {
          id: editingUser.id,
          data: {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            phone: form.phone.trim() || undefined,
            is_active: form.isActive,
          },
        },
        {
          onSuccess: () => {
            setNotification({ type: 'success', message: 'Usuario actualizado' });
            setDialogOpen(false);
          },
          onError: () => {
            setNotification({ type: 'error', message: 'No se pudo actualizar el usuario' });
          },
        },
      );
    } else {
      createUser.mutate(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone.trim() || undefined,
        },
        {
          onSuccess: () => {
            setNotification({ type: 'success', message: 'Usuario creado' });
            setDialogOpen(false);
          },
          onError: () => {
            setNotification({ type: 'error', message: 'No se pudo crear el usuario' });
          },
        },
      );
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
          {getHookErrorMessage(error) || 'No se pudieron cargar los usuarios'}
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
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestiona los usuarios del sistema</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="glass-btn-primary rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="size-4" />
          Nuevo Usuario
        </motion.button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="glass-input rounded-full pl-10 pr-4 py-2.5 h-auto text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((tab) => (
            <motion.button
              key={tab.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setRoleFilter(tab.value);
                setPage(1);
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                roleFilter === tab.value
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                  : 'glass-input hover:bg-teal-500/5',
              )}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Users Table */}
      <AnimatePresence mode="wait">
        {users.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center py-12 text-center"
          >
            <Users className="size-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Sin usuarios</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No se encontraron usuarios con los filtros aplicados
            </p>
            <button
              onClick={handleOpenCreate}
              className="glass-btn-primary rounded-full px-6 py-2 text-sm font-medium"
            >
              Nuevo Usuario
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
                    <TableHead className="text-muted-foreground">Usuario</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Contacto</TableHead>
                    <TableHead className="text-muted-foreground">Rol</TableHead>
                    <TableHead className="text-muted-foreground">Estado</TableHead>
                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem, i) => {
                    const roleColor = ROLE_COLORS[userItem.role];
                    return (
                      <motion.tr
                        key={userItem.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-border/30 hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                roleColor?.bg || 'bg-muted',
                                roleColor?.text || 'text-muted-foreground',
                              )}
                            >
                              {getInitials(userItem.name)}
                            </div>
                            <span className="font-medium text-foreground">{userItem.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="size-3 shrink-0" />
                              {userItem.email}
                            </div>
                            {userItem.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="size-3 shrink-0" />
                                {userItem.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 border',
                              roleColor?.bg || 'bg-muted',
                              roleColor?.text || 'text-muted-foreground',
                              roleColor?.border || 'border-transparent',
                            )}
                          >
                            <Shield className="size-3" />
                            {ROLE_LABELS[userItem.role] || userItem.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-xs font-medium',
                              (userItem.isActive ?? userItem.is_active)
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400',
                            )}
                          >
                            {(userItem.isActive ?? userItem.is_active) ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenEdit(userItem)}
                              className="inline-flex size-8 items-center justify-center rounded-full hover:bg-teal-500/10 transition-colors"
                              title="Editar usuario"
                            >
                              <Pencil className="size-3.5 text-teal-600 dark:text-teal-400" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                              className="inline-flex size-8 items-center justify-center rounded-full hover:bg-red-500/10 transition-colors"
                              title="Desactivar usuario"
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="size-3.5 text-red-600 dark:text-red-400" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t border-border/50 px-6 py-4 bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Mostrando <strong className="font-semibold text-foreground">{((page - 1) * limit) + 1}</strong> a <strong className="font-semibold text-foreground">{Math.min(page * limit, total)}</strong> de <strong className="font-semibold text-foreground">{total}</strong> usuarios
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center justify-center rounded-xl border border-border/50 bg-background/50 hover:bg-muted text-foreground size-8 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Pág. <strong className="font-semibold text-foreground">{page}</strong> de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center justify-center rounded-xl border border-border/50 bg-background/50 hover:bg-muted text-foreground size-8 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifica los datos del usuario' : 'Ingresa los datos del nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input
                placeholder="Nombre completo"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email *</label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
              />
            </div>
            {!editingUser && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Contraseña *</label>
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Rol *</label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((f) => ({ ...f, role: value as UserRole }))}
              >
                <SelectTrigger className="glass-input rounded-xl px-4 py-2.5 h-auto text-sm w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {editingUser && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-foreground block">Estado de la Cuenta</label>
                  <span className="text-xs text-muted-foreground">Permitir el acceso al usuario</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="size-5 rounded border-white/10 bg-slate-800 text-teal-500 focus:ring-0 cursor-pointer accent-teal-500"
                />
              </div>
            )}
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
              {editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
