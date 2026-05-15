'use client';

import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useSyncExternalStore } from 'react';

// Hydration-safe check: returns false during SSR, true on client
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className={`size-10 rounded-full glass flex items-center justify-center ${className}`}>
        <div className="size-5" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative size-10 rounded-full glass flex items-center justify-center overflow-hidden cursor-pointer ${className}`}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ y: -20, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 20, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Sun className="size-5 text-amber-500" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, rotate: 90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 20, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Moon className="size-5 text-slate-700" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: isDark
            ? '0 0 12px rgba(245, 158, 11, 0.2)'
            : '0 0 12px rgba(100, 116, 139, 0.15)',
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
}
