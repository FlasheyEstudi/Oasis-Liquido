'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles } from 'lucide-react';

export function NotificationBanner() {
  const { isSupported, permission, isEnabled, requestPermission } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Guarantee hydration match
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Do not show if not supported, permission already granted/enabled, or dismissed
  if (!isSupported || permission === 'granted' || isEnabled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed bottom-20 md:bottom-6 right-4 z-[9999] max-w-sm w-[calc(100vw-2rem)]"
      >
        <div className="glass-card overflow-hidden p-5 relative border border-emerald-500/20 dark:border-emerald-500/10 shadow-2xl rounded-2xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
          {/* Top highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />
          
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>

          <div className="flex gap-4 items-start">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Bell size={22} className="animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </span>
            </div>

            <div className="flex-1 pr-4">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  ¿Deseas activar notificaciones?
                </h4>
                <Sparkles size={12} className="text-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Recibe alertas en tiempo real sobre tus recetas médicas emitidas y el seguimiento GPS de tus pedidos en camino.
              </p>
              
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={requestPermission}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Activar alertas
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold py-2 px-3 rounded-xl transition-all active:scale-95"
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
