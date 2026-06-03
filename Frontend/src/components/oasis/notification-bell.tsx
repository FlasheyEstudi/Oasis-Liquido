'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getNotifications, markNotificationsAsRead, type Notification } from '@/api/notifications';
import { getSocket, joinUserRoom } from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
  Loader2,
  ShieldAlert,
  BellRing,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Relative date helper
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-NI', { month: 'short', day: 'numeric' });
}

// Icon themes per notification type
function getNotificationTheme(title: string, body: string) {
  const text = (title + ' ' + body).toLowerCase();
  if (text.includes('cita') || text.includes('consulta') || text.includes('médico')) {
    return {
      icon: <Calendar className="size-4 text-teal-600 dark:text-teal-400" />,
      bg: 'bg-teal-500/10 dark:bg-teal-400/10 border-teal-500/15',
    };
  }
  if (text.includes('receta') || text.includes('medicamento') || text.includes('pastilla')) {
    return {
      icon: <Pill className="size-4 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-500/10 dark:bg-indigo-400/10 border-indigo-500/15',
    };
  }
  if (text.includes('envío') || text.includes('delivery') || text.includes('reparto') || text.includes('repartidor')) {
    return {
      icon: <Truck className="size-4 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/15',
    };
  }
  if (text.includes('alerta') || text.includes('urgente') || text.includes('sos') || text.includes('peligro')) {
    return {
      icon: <ShieldAlert className="size-4 text-rose-600 dark:text-rose-400 animate-pulse" />,
      bg: 'bg-rose-500/10 dark:bg-rose-400/10 border-rose-500/15',
    };
  }
  return {
    icon: <Sparkles className="size-4 text-amber-600 dark:text-amber-400 animate-pulse" />,
    bg: 'bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/15',
  };
}

export function NotificationBell() {
  const { user, navigate } = useAuthStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, user?.role],
    queryFn: () => getNotifications({ page: 1, limit: 20 }),
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const allNotifications = notificationsData?.data || [];
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const filteredNotifications = filterTab === 'all' 
    ? allNotifications 
    : allNotifications.filter((n) => !n.isRead);

  // Mark Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: (variables: { notificationId?: string; all?: boolean }) =>
      markNotificationsAsRead(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, user?.role] });
    },
  });

  // Socket setup
  useEffect(() => {
    if (!user) return;
    try {
      joinUserRoom(user.id);
      const socket = getSocket();
      socket.on('notification:new', (newNotification: Notification) => {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.35;
          audio.play().catch(() => {});
        } catch {}
        
        // Show premium in-app toast notification
        toast.info(newNotification.title, {
          description: newNotification.body,
          action: newNotification.link ? {
            label: 'Ver',
            onClick: () => navigate(newNotification.link as any)
          } : undefined
        });

        // Invalidate notifications query
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, user?.role] });

        // Invalidate chats list/messages query if notification is a chat notification
        if (newNotification.type === 'chat') {
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      });
      return () => {
        socket.off('notification:new');
      };
    } catch (err) {
      console.warn('Real-time socket notifications could not be initialized:', err);
    }
  }, [user, queryClient, navigate]);

  // Click outside listener
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
      {/* Interactive Bell Icon Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative size-11 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-sm outline-none",
          isOpen 
            ? "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400 ring-4 ring-teal-500/10" 
            : "bg-white/40 dark:bg-zinc-900/40 border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
        )}
      >
        <motion.div
          animate={unreadCount > 0 ? {
            rotate: [0, -10, 10, -10, 10, 0],
          } : {}}
          transition={{ repeat: Infinity, repeatDelay: 6, duration: 0.6 }}
        >
          <Bell className="size-[19px]" />
        </motion.div>
        
        {/* Glow unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-lg animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Frosted Dropdown Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed sm:absolute left-4 sm:left-auto right-4 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[380px] z-50 rounded-[2.25rem] bg-white/90 dark:bg-zinc-950/90 border border-slate-200/70 dark:border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-500/[0.02] dark:bg-zinc-900/10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <BellRing className="size-3.5 text-teal-500 shrink-0" />
                  Alertas y Notificaciones
                </span>
                
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={markAsReadMutation.isPending}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:opacity-85 select-none shrink-0"
                  >
                    <CheckCheck className="size-3 text-teal-500" />
                    Leídas
                  </button>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-slate-500/[0.04] dark:bg-black/20 p-0.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                <button
                  onClick={() => setFilterTab('all')}
                  className={cn(
                    "flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                    filterTab === 'all'
                      ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-white shadow-sm border border-slate-200/40 dark:border-white/5"
                      : "text-slate-500 hover:text-slate-700 dark:text-zinc-450 dark:hover:text-zinc-300"
                  )}
                >
                  Todas ({allNotifications.length})
                </button>
                <button
                  onClick={() => setFilterTab('unread')}
                  className={cn(
                    "flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                    filterTab === 'unread'
                      ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-white shadow-sm border border-slate-200/40 dark:border-white/5"
                      : "text-slate-500 hover:text-slate-700 dark:text-zinc-450 dark:hover:text-zinc-300"
                  )}
                >
                  Sin Leer ({unreadCount})
                </button>
              </div>
            </div>

            {/* List area */}
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-slate-200/30 dark:divide-white/5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2">
                  <Loader2 className="size-6 text-teal-500 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 animate-pulse">Sincronizando alertas...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
                  {/* Glowing bell artwork */}
                  <div className="relative flex items-center justify-center size-14 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 shadow-inner">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="absolute inset-0 rounded-full bg-teal-500/5 animate-pulse"
                    />
                    <Inbox className="size-6 text-slate-400 dark:text-zinc-650 z-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">Bandeja Vacía</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-450 max-w-[220px] font-medium leading-relaxed">
                      Tu bandeja de salud está impecable. Te notificaremos cuando existan actualizaciones.
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((n, index) => {
                  const theme = getNotificationTheme(n.title, n.body);
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "flex gap-3.5 p-4 transition-all duration-200 cursor-pointer relative items-start select-none hover:bg-slate-500/[0.04]",
                        !n.isRead && "bg-teal-500/[0.02] dark:bg-teal-400/[0.01]"
                      )}
                    >
                      {/* Unread Indicator Glow */}
                      {!n.isRead && (
                        <div className="absolute top-5 left-1.5 size-1.5 rounded-full bg-teal-500 shadow-lg ring-2 ring-teal-500/20" />
                      )}

                      {/* Icon */}
                      <div className={cn(
                        'flex size-9 items-center justify-center rounded-xl shrink-0 border shadow-inner',
                        theme.bg
                      )}>
                        {theme.icon}
                      </div>

                      {/* Details Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className={cn(
                            "text-xs leading-tight text-slate-800 dark:text-white truncate",
                            !n.isRead ? "font-black" : "font-extrabold"
                          )}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550 flex items-center gap-1 shrink-0 mt-0.5">
                            <Clock className="size-2.5" />
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold break-words">
                          {n.body}
                        </p>
                        
                        {n.link && (
                          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mt-2 group select-none">
                            <span>Ver expediente</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        )}
                      </div>
                    </motion.div>
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
