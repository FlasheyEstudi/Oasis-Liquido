'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getNotifications, markNotificationsAsRead, type Notification } from '@/api/notifications';
import { getSocket, joinUserRoom } from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  Inbox, 
  ArrowRight,
  Sparkles,
  Calendar,
  Pill,
  Truck,
  AlertTriangle,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format date relatively in Spanish
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('es-NI', { month: 'short', day: 'numeric' });
}

// Map notification type to icon and colors
function getNotificationTheme(title: string, body: string) {
  const t = (title + ' ' + body).toLowerCase();
  if (t.includes('cita') || t.includes('consulta') || t.includes('médico')) {
    return {
      icon: <Calendar className="size-4.5 text-teal-655" />,
      bg: 'bg-teal-500/10 dark:bg-teal-500/[0.08]',
      border: 'border-teal-500/20',
    };
  }
  if (t.includes('receta') || t.includes('medicamento') || t.includes('pastilla')) {
    return {
      icon: <Pill className="size-4.5 text-indigo-505" />,
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/[0.08]',
      border: 'border-indigo-500/20',
    };
  }
  if (t.includes('envío') || t.includes('delivery') || t.includes('reparto') || t.includes('repartidor')) {
    return {
      icon: <Truck className="size-4.5 text-emerald-505" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/[0.08]',
      border: 'border-emerald-500/20',
    };
  }
  if (t.includes('alerta') || t.includes('urgente') || t.includes('sos') || t.includes('peligro')) {
    return {
      icon: <AlertTriangle className="size-4.5 text-red-500" />,
      bg: 'bg-red-500/10 dark:bg-red-500/[0.08]',
      border: 'border-red-500/20',
    };
  }
  return {
    icon: <Sparkles className="size-4.5 text-sky-505" />,
    bg: 'bg-sky-500/10 dark:bg-sky-500/[0.08]',
    border: 'border-sky-500/20',
  };
}

export function NotificationBell() {
  const { user, navigate } = useAuthStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Notifications with React Query
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, user?.role],
    queryFn: () => getNotifications({ page: 1, limit: 20 }),
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 2. Mutations to mark as read
  const markAsReadMutation = useMutation({
    mutationFn: (variables: { notificationId?: string; all?: boolean }) =>
      markNotificationsAsRead(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, user?.role] });
    },
  });

  // 3. Real-time Sockets Integration
  useEffect(() => {
    if (!user) return;

    try {
      joinUserRoom(user.id);
      const socket = getSocket();

      socket.on('notification:new', (newNotification: Notification) => {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}

        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, user?.role] });
      });

      return () => {
        socket.off('notification:new');
      };
    } catch (err) {
      console.warn('Real-time socket notifications could not be initialized:', err);
    }
  }, [user, queryClient]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    markAsReadMutation.mutate({ all: true });
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      markAsReadMutation.mutate({ notificationId: n.id });
    }
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-2xl transition-all duration-300 border select-none h-11 w-11 flex items-center justify-center shadow-md",
          isOpen 
            ? "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400 ring-2 ring-teal-500/10" 
            : "bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-500/5"
        )}
      >
        <motion.div
          animate={unreadCount > 0 ? {
            rotate: [0, -12, 12, -12, 12, 0],
          } : {}}
          transition={{
            repeat: Infinity,
            repeatDelay: 5,
            duration: 0.5,
          }}
        >
          <Bell className="size-5" />
        </motion.div>
        
        {/* Badge Indicator */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-md ring-2 ring-rose-500/10"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed sm:absolute left-4 sm:left-auto right-4 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[380px] z-50 rounded-3xl glass-strong border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/40 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider">Centro de Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-black text-[9px] uppercase tracking-wider border border-teal-500/10 animate-pulse">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAsReadMutation.isPending}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-teal-655 hover:text-teal-700 dark:text-teal-400 transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="size-3.5" />
                  Marcar leídas
                </button>
              )}
            </div>

            {/* Notification List Area */}
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="size-6 text-teal-500 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-550 animate-pulse">Sincronizando alertas...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center gap-3">
                  <div className="p-3.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-zinc-600">
                    <Inbox className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Bandeja Vacía</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-450 mt-1 max-w-[240px] leading-relaxed">
                      No tienes alertas pendientes. Te notificaremos cuando existan actualizaciones relativas a tu salud.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => {
                  const theme = getNotificationTheme(n.title, n.body);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "flex gap-3.5 p-4 transition-all duration-200 cursor-pointer relative items-start select-none",
                        n.isRead
                          ? "bg-transparent hover:bg-slate-500/5"
                          : "bg-teal-500/5 hover:bg-teal-500/10 dark:bg-teal-500/[0.02] dark:hover:bg-teal-500/[0.06]"
                      )}
                    >
                      {/* Unread dot indicator */}
                      {!n.isRead && (
                        <div className="absolute top-5.5 left-1.5 size-1.5 rounded-full bg-teal-500 animate-pulse" />
                      )}

                      {/* Icon container */}
                      <div className={cn(
                        'flex size-9 items-center justify-center rounded-xl shrink-0 border',
                        theme.bg,
                        theme.border
                      )}>
                        {theme.icon}
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className={cn(
                            "text-xs leading-snug truncate text-slate-850 dark:text-white",
                            !n.isRead ? "font-black" : "font-semibold"
                          )}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550 flex items-center gap-1 shrink-0 mt-0.5">
                            <Clock className="size-2.5" />
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal break-words">
                          {n.body}
                        </p>
                        
                        {n.link && (
                          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-655 dark:text-teal-400 mt-2 group">
                            <span>Ver detalles</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
