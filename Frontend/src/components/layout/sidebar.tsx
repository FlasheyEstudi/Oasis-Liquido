'use client';

import { useAuthStore } from '@/store/auth-store';
import { ROLE_LABELS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import type { AppPage, UserRole } from '@/types';
import {
  LayoutDashboard,
  Building2,
  Pill,
  Users,
  FileText,
  CalendarDays,
  Home,
  QrCode,
  MapPin,
  ShoppingBag,
  Package,
  Truck,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// --- Navigation items per role ---
interface NavItem {
  page: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { page: 'inicio', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'gestionar-clinicas', label: 'Clínicas', icon: Building2 },
    { page: 'gestionar-farmacias', label: 'Farmacias', icon: Pill },
    { page: 'gestionar-usuarios', label: 'Usuarios', icon: Users },
    { page: 'auditoria', label: 'Auditoría', icon: FileText },
  ],
  doctor: [
    { page: 'inicio', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'citas', label: 'Mis Citas', icon: CalendarDays },
  ],
  receptionist: [
    { page: 'inicio', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'citas', label: 'Citas', icon: CalendarDays },
  ],
  patient: [
    { page: 'inicio', label: 'Inicio', icon: Home },
    { page: 'citas', label: 'Mis Citas', icon: CalendarDays },
    { page: 'recetas', label: 'Mis Recetas', icon: FileText },
    { page: 'mapa-farmacias', label: 'Buscar Farmacias', icon: MapPin },
    { page: 'gestion-pedidos', label: 'Mis Pedidos', icon: ShoppingBag },
  ],
  pharmacy_manager: [
    { page: 'inicio', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'inventario', label: 'Inventario', icon: Package },
    { page: 'surtimiento', label: 'Recetas (QR)', icon: QrCode },
    { page: 'gestion-pedidos', label: 'Pedidos', icon: ClipboardList },
  ],
  delivery_driver: [
    { page: 'inicio-repartidor', label: 'Mis Entregas', icon: Truck },
  ],
};

// --- Sub-pages that highlight their parent nav item ---
const PARENT_PAGE_MAP: Partial<Record<AppPage, AppPage>> = {
  'nueva-cita': 'citas',
  'detalle-cita': 'citas',
  'detalle-receta': 'recetas',
  'detalle-farmacia': 'mapa-farmacias',
  'solicitud-envio': 'mapa-farmacias',
  'seguimiento': 'gestion-pedidos',
  'consulta': 'citas',
  'detalle-envio': 'inicio-repartidor',
  'perfil': 'inicio',
};

function getActiveParentPage(currentPage: AppPage): AppPage {
  return PARENT_PAGE_MAP[currentPage] ?? currentPage;
}

// --- Sidebar content (shared between desktop and mobile) ---
interface SidebarContentProps {
  collapsed: boolean;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}

function SidebarContent({ collapsed, onNavigate, onLogout }: SidebarContentProps) {
  const { user, currentPage } = useAuthStore();

  if (!user) return null;

  const role = user.role;
  const navItems = NAV_ITEMS[role] ?? [];
  const activeParent = getActiveParentPage(currentPage);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* User info at top */}
      <div className={cn(
        'flex items-center gap-3 border-b px-4 py-4',
        collapsed && 'justify-center px-2'
      )}>
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.avatar_url} alt={user.name} />
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{ROLE_LABELS[role]}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeParent === item.page;
            const Icon = item.icon;

            const navButton = (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn(
                  'size-5 shrink-0',
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                )} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.page}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navButton;
          })}
        </nav>
      </ScrollArea>

      {/* Bottom: Logout */}
      <div className="border-t px-2 py-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="size-5 text-gray-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Cerrar sesión
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-5 text-gray-400" />
            <span>Cerrar sesión</span>
          </button>
        )}
      </div>
    </div>
  );
}

// --- Desktop Sidebar ---
interface DesktopSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DesktopSidebar({ collapsed, onToggleCollapse }: DesktopSidebarProps) {
  const { navigate, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        onNavigate={(page) => navigate(page)}
        onLogout={logout}
      />
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-7 z-10 flex size-6 items-center justify-center rounded-full border bg-white shadow-sm transition-colors hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5 text-gray-500" />
        ) : (
          <ChevronLeft className="size-3.5 text-gray-500" />
        )}
      </button>
    </aside>
  );
}

// --- Mobile Sidebar (Sheet) ---
interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { navigate, logout } = useAuthStore();

  const handleNavigate = (page: AppPage) => {
    navigate(page);
    onOpenChange(false);
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menú de navegación</SheetTitle>
        </SheetHeader>
        <SidebarContent
          collapsed={false}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </SheetContent>
    </Sheet>
  );
}

// --- Page title mapping ---
export const PAGE_TITLES: Record<AppPage, string> = {
  bienvenida: 'Oasis Aura',
  entrar: 'Iniciar Sesión',
  registro: 'Registro',
  'recuperar-cuenta': 'Recuperar Contraseña',
  'cambiar-clave': 'Restablecer Contraseña',
  inicio: 'Dashboard',
  citas: 'Citas',
  'nueva-cita': 'Nueva Cita',
  'detalle-cita': 'Detalle de Cita',
  recetas: 'Recetas',
  'detalle-receta': 'Detalle de Receta',
  'mapa-farmacias': 'Farmacias',
  'detalle-farmacia': 'Detalle de Farmacia',
  'solicitud-envio': 'Solicitar Entrega',
  seguimiento: 'Seguimiento de Pedido',
  consulta: 'Consulta',
  'gestionar-clinicas': 'Clínicas',
  'gestionar-farmacias': 'Farmacias',
  'gestionar-usuarios': 'Usuarios',
  inventario: 'Inventario',
  surtimiento: 'Surtir Recetas',
  'gestion-pedidos': 'Pedidos',
  'inicio-repartidor': 'Mis Entregas',
  'detalle-envio': 'Detalle de Entrega',
  perfil: 'Mi Perfil',
  auditoria: 'Auditoría',
  venta: 'Punto de Venta',
};

export function getPageTitle(page: AppPage): string {
  return PAGE_TITLES[page] ?? page;
}
