'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles, Shield } from 'lucide-react';

export function NotificationBanner() {
  const { isSupported, permission, isEnabled, requestPermission } = useNotifications();
  const { isAuthenticated } = useAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Guarantee hydration match
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Do not show if user is not authenticated, not supported, permission already granted, or dismissed
  if (!isAuthenticated || !isSupported || permission === 'granted' || isEnabled || isDismissed) {
    return null;
  }

  // Animation variants for the bell swinging dynamically
  const bellVariants: any = {
    ring: {
      rotate: [0, -15, 12, -10, 8, -4, 0],
      scale: [1, 1.1, 1.1, 1.05, 1.05, 1, 1],
      transition: {
        duration: 1.4,
        repeat: Infinity,
        repeatDelay: 3.5,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 z-[9999] md:max-w-md w-auto pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-white/20 dark:border-zinc-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/70 dark:bg-zinc-950/80 backdrop-blur-2xl p-5 md:p-6 transition-all duration-300">
          
          {/* Holographic background light leak */}
          <div className="absolute -left-12 -top-12 size-36 bg-gradient-to-tr from-emerald-500/20 to-primary/0 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 size-44 bg-gradient-to-tr from-sky-500/20 to-primary/0 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-primary to-sky-400 opacity-90" />
          
          {/* Close button with premium hover effect */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={15} />
          </button>

          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
            
            {/* Animated Floating Bell Icon */}
            <div className="relative shrink-0 select-none">
              <motion.div 
                variants={bellVariants}
                animate="ring"
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 dark:from-emerald-500 dark:to-teal-700 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] border border-emerald-300/20"
              >
                <Bell size={26} className="fill-white/10" />
              </motion.div>
              
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white dark:border-zinc-950 items-center justify-center">
                  <span className="size-1 rounded-full bg-white" />
                </span>
              </span>
            </div>

            {/* Text Information Container */}
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h4 className="font-extrabold text-zinc-800 dark:text-white text-base tracking-tight leading-tight">
                  ¿Activar alertas de salud?
                </h4>
                <Sparkles size={13} className="text-emerald-500 animate-pulse fill-emerald-500/10" />
              </div>
              
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-[280px] sm:max-w-none">
                Recibe notificaciones en tiempo real sobre tus recetas médicas emitidas y el seguimiento de tus pedidos en camino.
              </p>
              
              {/* Premium Button Controls */}
              <div className="flex flex-col sm:flex-row gap-2 mt-5">
                <button
                  onClick={requestPermission}
                  className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest py-3 px-5 rounded-2xl shadow-xl hover:shadow-emerald-500/10 hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-zinc-800 dark:border-white"
                >
                  <Shield size={13} className="fill-current/10" />
                  Activar alertas
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 text-xs font-extrabold uppercase tracking-wider py-3 px-4 rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  Ahora no
                </button>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
