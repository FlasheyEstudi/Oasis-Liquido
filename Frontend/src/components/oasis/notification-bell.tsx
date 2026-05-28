'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getNotifications, markNotificationsAsRead, type Notification } from '@/api/notifications';
import { getSocket, joinUserRoom } from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock, Inbox, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format date relatively in Spanish
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('es-NI', { month: 'short', day: 'numeric' });
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
      // Connect and join room
      joinUserRoom(user.id);
      const socket = getSocket();

      // Listen for new notifications
      socket.on('notification:new', (newNotification: Notification) => {
        console.log('🔔 New real-time notification received:', newNotification);
        // Play subtle sound if settings allow
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch {}

        // Invalidate notifications to trigger re-fetch
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
    // Mark as read if not already
    if (!n.isRead) {
      markAsReadMutation.mutate({ notificationId: n.id });
    }
    
    // Close dropdown
    setIsOpen(false);

    // Redirect to link if specified
    if (n.link) {
      navigate(n.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all border",
          isOpen 
            ? "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400" 
            : "bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-500/5"
        )}
      >
        <Bell className="size-[18px]" />
        
        {/* Badge Indicator */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-sm"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
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
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed sm:absolute left-4 sm:left-auto right-4 sm:right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[380px] z-50 rounded-2xl glass-strong border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/40 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-[10px]">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAsReadMutation.isPending}
                  className="flex items-center gap-1 text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="size-3.5" />
                  Marcar leídas
                </button>
              )}
            </div>

            {/* Notification List Area */}
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="size-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Cargando notificaciones...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400">
                    <Inbox className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bandeja vacía</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                      Te notificaremos cuando ocurran eventos importantes relativos a tu cuenta.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex gap-3 p-4 transition-all duration-200 cursor-pointer relative",
                      n.isRead
                        ? "bg-transparent hover:bg-slate-500/5"
                        : "bg-teal-500/5 hover:bg-teal-500/10 dark:bg-teal-500/[0.02] dark:hover:bg-teal-500/[0.06]"
                    )}
                  >
                    {/* Unread circle badge indicator */}
                    {!n.isRead && (
                      <div className="absolute top-4 left-1.5 size-1.5 rounded-full bg-teal-500" />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className={cn(
                          "text-xs leading-tight truncate text-slate-800 dark:text-slate-200",
                          !n.isRead ? "font-bold" : "font-medium"
                        )}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                          <Clock className="size-2.5" />
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal break-words">
                        {n.body}
                      </p>
                      
                      {n.link && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 mt-2 group">
                          Ver detalle
                          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
