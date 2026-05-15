'use client';

import { useAuthStore } from '@/store/auth-store';
import type { AppPage, UserRole } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  QrCode,
  Stethoscope,
  Droplets,
  Truck,
  UserPlus,
} from 'lucide-react';

// FAB config per role and current page
function getFabConfig(
  role: UserRole,
  currentPage: AppPage
): { icon: React.ReactNode; label: string; page: AppPage } | null {
  switch (role) {
    case 'patient':
      switch (currentPage) {
        case 'home':
        case 'appointments':
          return { icon: <Plus className="size-6" />, label: 'Agendar', page: 'new-appointment' };
        case 'prescriptions':
          return { icon: <QrCode className="size-6" />, label: 'Escanear', page: 'pharmacy-map' };
        case 'pharmacy-map':
          return { icon: <Truck className="size-6" />, label: 'Delivery', page: 'delivery-request' };
        default:
          return { icon: <Plus className="size-6" />, label: 'Agendar', page: 'new-appointment' };
      }
    case 'doctor':
      return { icon: <Stethoscope className="size-6" />, label: 'Consulta', page: 'consultation' };
    case 'pharmacy_manager':
      switch (currentPage) {
        case 'home':
          return { icon: <QrCode className="size-6" />, label: 'Escanear QR', page: 'fulfillment' };
        default:
          return { icon: <QrCode className="size-6" />, label: 'Escanear QR', page: 'fulfillment' };
      }
    case 'delivery_driver':
      return null; // Driver doesn't need a FAB
    case 'admin':
      switch (currentPage) {
        case 'manage-users':
          return { icon: <UserPlus className="size-6" />, label: 'Nuevo', page: 'manage-users' };
        default:
          return null;
      }
    default:
      return null;
  }
}

export function ContextualFAB() {
  const { user, currentPage, navigate } = useAuthStore();

  if (!user) return null;

  const config = getFabConfig(user.role, currentPage);
  if (!config) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={`${user.role}-${currentPage}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate(config.page)}
        className="fixed bottom-20 right-4 z-40 lg:hidden size-14 rounded-2xl glass-btn-primary flex items-center justify-center shadow-lg shadow-teal-500/30"
        aria-label={config.label}
      >
        {config.icon}
      </motion.button>
    </AnimatePresence>
  );
}
