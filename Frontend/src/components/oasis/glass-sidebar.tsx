'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { APP_NAME, ROLE_LABELS, ROLE_COLORS } from '@/utils/constants';
import type { AppPage, UserRole } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  FileText,
  MapPin,
  Package,
  Stethoscope,
  Shield,
  Pill,
  Truck,
  Sun,
  Moon,
  LogOut,
  User,
  Droplets,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Navigation items per role
function getNavItems(role: UserRole): { page: AppPage; label: string; icon: React.ReactNode }[] {
  switch (role) {
    case 'patient':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'appointments', label: 'Citas', icon: <Calendar className="size-[18px]" /> },
        { page: 'new-appointment', label: 'Agendar', icon: <Calendar className="size-[18px]" /> },
        { page: 'prescriptions', label: 'Recetas', icon: <FileText className="size-[18px]" /> },
        { page: 'pharmacy-map', label: 'Farmacias', icon: <MapPin className="size-[18px]" /> },
        { page: 'order-tracking', label: 'Mis Pedidos', icon: <Truck className="size-[18px]" /> },
      ];
    case 'doctor':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'consultation', label: 'Consulta', icon: <Stethoscope className="size-[18px]" /> },
        { page: 'prescriptions', label: 'Recetas', icon: <FileText className="size-[18px]" /> },
      ];
    case 'pharmacy_manager':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'fulfillment', label: 'Surtir Receta', icon: <Pill className="size-[18px]" /> },
        { page: 'inventory', label: 'Inventario', icon: <Package className="size-[18px]" /> },
        { page: 'order-management', label: 'Pedidos', icon: <FileText className="size-[18px]" /> },
      ];
    case 'delivery_driver':
      return [
        { page: 'driver-home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'delivery-detail', label: 'Entregas', icon: <Truck className="size-[18px]" /> },
      ];
    case 'admin':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'manage-clinics', label: 'Clínicas', icon: <MapPin className="size-[18px]" /> },
        { page: 'manage-pharmacies', label: 'Farmacias', icon: <Pill className="size-[18px]" /> },
        { page: 'manage-users', label: 'Usuarios', icon: <Shield className="size-[18px]" /> },
        { page: 'audit-logs', label: 'Auditoría', icon: <FileText className="size-[18px]" /> },
      ];
    case 'receptionist':
      return [
        { page: 'home', label: 'Inicio', icon: <Home className="size-[18px]" /> },
        { page: 'appointments', label: 'Citas', icon: <Calendar className="size-[18px]" /> },
      ];
    default:
      return [];
  }
}

export function GlassSidebar() {
  const { user, currentPage, navigate, logout } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const expanded = isHovered || pinned;
  const sidebarWidth = expanded ? 260 : 72;

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-sidebar fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden"
    >
      {/* Logo Area */}
      <div className="flex items-center h-[60px] px-4 border-b border-sidebar-border">
        <motion.button
          onClick={() => navigate('inicio')}
          className="flex items-center gap-3 w-full overflow-hidden"
          whileTap={{ scale: 0.95 }}
        >
          <div className="size-9 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Droplets className="size-5 text-white" />
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="font-extrabold text-lg tracking-tight text-teal-700 dark:text-teal-400 whitespace-nowrap"
              >
                OASIS
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <motion.button
                key={item.page}
                onClick={() => navigate(item.page)}
                onMouseEnter={() => setHoveredItem(item.page)}
                onMouseLeave={() => setHoveredItem(null)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative flex items-center gap-3 w-full rounded-xl transition-all duration-200',
                  expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
                  isActive
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/5'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-teal-500 dark:bg-teal-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <span className="relative z-10 shrink-0">{item.icon}</span>

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {!expanded && hoveredItem === item.page && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg glass-strong text-sm font-medium text-foreground whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>


      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {/* Profile */}
        <motion.button
          onClick={() => navigate('profile')}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
            expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
            currentPage === 'profile'
              ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/5'
          )}
        >
          <User className="size-[18px] shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Perfil
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Theme Toggle */}
        {mounted && (
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
              expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
              'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/5'
            )}
          >
            {theme === 'dark' ? <Sun className="size-[18px] shrink-0" /> : <Moon className="size-[18px] shrink-0" />}
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* Logout */}
        <motion.button
          onClick={logout}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
            expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
            'text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5'
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Pin/Unpin Toggle */}
        <motion.button
          onClick={() => setPinned(!pinned)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
            expanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5',
            pinned
              ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-500/5'
          )}
        >
          <div className={cn(
            'size-[18px] shrink-0 rounded-sm border-2 transition-colors',
            pinned
              ? 'border-teal-500 bg-teal-500'
              : 'border-slate-400 dark:border-slate-500'
          )}>
            {pinned && (
              <svg viewBox="0 0 18 18" className="size-full text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4,9 7,12 14,5" />
              </svg>
            )}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                {pinned ? 'Fijado' : 'Fijar barra'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
