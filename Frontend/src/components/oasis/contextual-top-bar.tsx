'use client';

import { useAuthStore } from '@/store/auth-store';
import { ROLE_LABELS, ROLE_COLORS } from '@/utils/constants';
import type { AppPage, UserRole } from '@/types';
import { motion } from 'framer-motion';
import {
  Search,
  Menu,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Page title map
const PAGE_TITLES: Record<string, string> = {
  home: 'Inicio',
  appointments: 'Mis Citas',
  'new-appointment': 'Agendar Cita',
  'appointment-detail': 'Detalle de Cita',
  prescriptions: 'Mis Recetas',
  'prescription-detail': 'Detalle de Receta',
  'pharmacy-map': 'Farmacias Cercanas',
  'pharmacy-detail': 'Detalle de Farmacia',
  'delivery-request': 'Solicitar Delivery',
  'order-tracking': 'Mis Pedidos',
  consultation: 'Consulta Médica',
  'manage-clinics': 'Gestionar Clínicas',
  'manage-pharmacies': 'Gestionar Farmacias',
  'manage-users': 'Gestionar Usuarios',
  'audit-logs': 'Logs de Auditoría',
  inventory: 'Inventario',
  fulfillment: 'Surtir Receta',
  'order-management': 'Pedidos',
  'driver-home': 'Inicio',
  'delivery-detail': 'Detalle de Entrega',
  profile: 'Mi Perfil',
};

// Breadcrumb parent
const PAGE_PARENTS: Record<string, AppPage | null> = {
  'new-appointment': 'appointments',
  'appointment-detail': 'appointments',
  'prescription-detail': 'prescriptions',
  'pharmacy-detail': 'pharmacy-map',
  'delivery-request': 'order-tracking',
  consultation: 'home',
  fulfillment: 'home',
  inventory: 'home',
  'order-management': 'home',
  'delivery-detail': 'driver-home',
};

interface ContextualTopBarProps {
  onMenuClick: () => void;
}

export function ContextualTopBar({ onMenuClick }: ContextualTopBarProps) {
  const { user, currentPage, navigate } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  if (!user) return null;

  const roleColors = ROLE_COLORS[user.role];
  const pageTitle = PAGE_TITLES[currentPage] || currentPage;
  const parentPage = PAGE_PARENTS[currentPage];
  const parentTitle = parentPage ? PAGE_TITLES[parentPage] : null;

  return (
    <header className="h-[60px] flex items-center justify-between px-4 lg:px-6 border-b border-border/50">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-500/5 transition-colors text-slate-500 dark:text-slate-400"
        >
          <Menu className="size-5" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm">
          {parentPage && parentTitle ? (
            <>
              <button
                onClick={() => navigate(parentPage)}
                className="text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {parentTitle}
              </button>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-semibold text-foreground">{pageTitle}</span>
            </>
          ) : (
            <span className="font-semibold text-foreground">{pageTitle}</span>
          )}
        </nav>
      </div>

      {/* Right side: Search + Role + Profile */}
      <div className="flex items-center gap-2">
        {/* Universal Search Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSearchOpen(!searchOpen)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-input text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="size-3.5" />
          <span>Buscar...</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-white/5 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </motion.button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-500/5 transition-colors text-slate-500 dark:text-slate-400">
          <Bell className="size-[18px]" />
          <div className="absolute top-1.5 right-1.5 size-2 rounded-full bg-teal-500" />
        </button>

        {/* User Role Badge */}
        <div
          className={cn(
            'hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
            roleColors.bg, roleColors.text, roleColors.border
          )}
        >
          {ROLE_LABELS[user.role]}
        </div>

        {/* User Avatar */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('profile')}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-500/5 transition-colors"
        >
          <div className="size-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {user.name.charAt(0)}
            </span>
          </div>
          <span className="hidden md:block text-sm font-medium text-foreground truncate max-w-[120px]">
            {user.name.split(' ')[0]}
          </span>
        </motion.button>
      </div>
    </header>
  );
}
