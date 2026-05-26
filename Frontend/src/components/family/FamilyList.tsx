'use client';

import { useState, useEffect } from 'react';
import { Users, UserX, Settings2, ShieldCheck, Heart, User, Loader2 } from 'lucide-react';
import { get, del, put } from '@/api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingAnimation } from '@/components/ui/loading-animation';

interface FamilyMember {
  id: string;
  patient_id?: string;
  caregiver_id?: string;
  relationship: string;
  status: string;
  permissions: string[];
  patient?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  caregiver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export function FamilyList() {
  const [caregiverFor, setCaregiverFor] = useState<FamilyMember[]>([]);
  const [patientOf, setPatientOf] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchFamily();
  }, []);

  async function fetchFamily() {
    setIsLoading(true);
    try {
      const response = await get<{ caregiverFor: FamilyMember[]; patientOf: FamilyMember[] }>('/family/list');
      if (response.success && response.data) {
        setCaregiverFor(response.data.caregiverFor);
        setPatientOf(response.data.patientOf);
      }
    } catch (err) {
      console.error('Failed to fetch family members', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta vinculación familiar?')) return;

    try {
      const response = await del(`/family/${id}/remove`);
      if (response.success) {
        fetchFamily();
      }
    } catch (err) {
      alert('Error al revocar la vinculación.');
      console.error(err);
    }
  }

  function openPermissionsModal(member: FamilyMember) {
    setActiveSettingsId(member.id);
    setTempPermissions(member.permissions);
  }

  async function savePermissions(id: string) {
    setSavingPermissions(true);
    try {
      const response = await put(`/family/${id}/permissions`, {
        permissions: tempPermissions,
      });
      if (response.success) {
        setActiveSettingsId(null);
        fetchFamily();
      }
    } catch (err) {
      alert('Error al guardar permisos.');
      console.error(err);
    } finally {
      setSavingPermissions(false);
    }
  }

  const allPermissions = [
    { id: 'view_health_data', label: 'Ver datos médicos y recetas' },
    { id: 'buy_medicines', label: 'Comprar medicamentos en su nombre' },
    { id: 'schedule_appointments', label: 'Programar citas médicas' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingAnimation size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Dependientes a cargo (Supervisor Mode) */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-2">
          <Users className="h-4.5 w-4.5" />
          Miembros familiares que superviso
        </h3>

        {caregiverFor.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground text-xs">
            No tienes miembros familiares agregados en este momento.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {caregiverFor.map((member) => (
              <motion.div
                key={member.id}
                layout
                className="glass-card rounded-2xl p-5 border border-border/40 shadow-sm relative overflow-hidden flex flex-col justify-between h-40"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600">
                      {member.relationship}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      member.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {member.status === 'active' ? 'vinculado' : 'pendiente'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{member.patient?.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{member.patient?.email}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border/30 mt-3 justify-end">
                  {member.status === 'active' && (
                    <button
                      onClick={() => openPermissionsModal(member)}
                      className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Configurar permisos"
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Eliminar vinculación"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Cuidadores (Dependent Mode) */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5" />
          Familiares / Supervisores autorizados
        </h3>

        {patientOf.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground text-xs">
            Ningún familiar te está supervisando actualmente.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {patientOf.map((member) => (
              <motion.div
                key={member.id}
                layout
                className="glass-card rounded-2xl p-5 border border-border/40 shadow-sm flex flex-col justify-between h-40"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                      {member.relationship}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      activo
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{member.caregiver?.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{member.caregiver?.email}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-3">
                  <span className="text-[10px] font-medium text-muted-foreground italic">
                    Tiene acceso a tu perfil
                  </span>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Eliminar autorización"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      <AnimatePresence>
        {activeSettingsId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <h4 className="text-base font-bold text-foreground mb-4">Configurar Permisos Familiares</h4>
              <p className="text-xs text-muted-foreground mb-5">
                Define qué acciones puede realizar este supervisor en relación con la cuenta del dependiente:
              </p>

              <div className="space-y-3">
                {allPermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={tempPermissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempPermissions([...tempPermissions, permission.id]);
                        } else {
                          setTempPermissions(tempPermissions.filter((p) => p !== permission.id));
                        }
                      }}
                      className="mt-1 h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-foreground block">{permission.label}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setActiveSettingsId(null)}
                  disabled={savingPermissions}
                  className="glass-btn w-1/2 h-10 rounded-full text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => savePermissions(activeSettingsId)}
                  disabled={savingPermissions}
                  className="glass-btn-primary w-1/2 h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {savingPermissions && <Loader2 className="h-3 w-3 animate-spin" />}
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
