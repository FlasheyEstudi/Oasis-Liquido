'use client';

import { useState } from 'react';
import { 
  UserPlus, 
  Mail, 
  Phone, 
  User, 
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCreateUser } from '@/hooks/use-api';

export function PatientRegistrationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123' // Default password for walk-ins
  });

  const createUser = useCreateUser();

  const handleRegister = () => {
    if (!form.name || !form.email) {
      toast.error('Nombre y Email son obligatorios');
      return;
    }

    createUser.mutate(
      {
        ...form,
        role: 'patient'
      },
      {
        onSuccess: () => {
          toast.success('Paciente registrado exitosamente');
          onClose();
          setForm({ name: '', email: '', phone: '', password: 'password123' });
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Error al registrar paciente');
        }
      }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="size-6" />
            </button>

            <div className="text-center mb-8">
              <div className="size-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                <UserPlus className="size-10" />
              </div>
              <h3 className="text-2xl font-bold">Registro Rápido</h3>
              <p className="text-sm text-gray-500 mt-1">Alta de paciente para atención inmediata</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input 
                    placeholder="Ej. Juan Pérez"
                    className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-white/5"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input 
                    type="email"
                    placeholder="paciente@oasis.com"
                    className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-white/5"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Teléfono (Opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input 
                    placeholder="+505 8888 8888"
                    className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-white/5"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 rounded-2xl flex gap-3 mt-4">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                  Se generará una contraseña temporal por defecto. El paciente podrá cambiarla al iniciar sesión en el portal.
                </p>
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 rounded-xl mt-4"
                disabled={createUser.isPending}
                onClick={handleRegister}
              >
                {createUser.isPending ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="size-5 mr-2" />
                    Registrar Paciente
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
