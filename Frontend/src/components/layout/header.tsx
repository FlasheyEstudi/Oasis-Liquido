'use client';

import { useAuthStore } from '@/store/auth-store';
import { ROLE_LABELS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import { getPageTitle } from '@/components/layout/sidebar';
import { useNotifications, useMarkNotificationsAsRead } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { Bell, Menu, Check, CheckSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, currentPage, navigate, logout } = useAuthStore();

  const pageTitle = getPageTitle(currentPage);

  // Fetch notifications
  const { data: notificationsData } = useNotifications({ page: 1, limit: 10 });
  const markAsRead = useMarkNotificationsAsRead();

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAsRead.mutate({ all: true });
  };

  const handleMarkOneRead = (id: string) => {
    markAsRead.mutate({ notificationId: id });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </Button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right side actions */}
      {user && (
        <div className="flex items-center gap-2">
          {/* Notification bell dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative shrink-0 rounded-full hover:bg-gray-100">
                <Bell className="size-5 text-gray-500" />
                <span className="sr-only">Notificaciones</span>
                {/* Notification dot indicator */}
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 size-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border border-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border/30">
                <span className="text-sm font-bold text-gray-800">Notificaciones</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                  >
                    <CheckSquare className="size-3.5" />
                    Leídas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/20">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No tienes notificaciones
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={cn(
                        "p-4 hover:bg-gray-50/50 transition-colors flex gap-3 items-start relative group",
                        !notif.isRead && "bg-teal-500/[0.02]"
                      )}
                    >
                      {!notif.isRead && (
                        <span className="absolute left-2.5 top-5 size-1.5 rounded-full bg-teal-500" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className={cn("text-xs font-semibold text-gray-800 leading-snug", !notif.isRead && "font-bold")}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 leading-normal">
                          {notif.body}
                        </p>
                        <span className="text-[10px] text-gray-400 block pt-0.5">
                          {new Date(notif.createdAt).toLocaleDateString('es-NI', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkOneRead(notif.id)}
                          className="text-gray-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100 shrink-0"
                          title="Marcar como leída"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-auto py-1.5">
                <Avatar className="size-8">
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('profile')}>
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
