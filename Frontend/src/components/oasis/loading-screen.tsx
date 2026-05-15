'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useCallback } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

// Smooth ease-out curve
const ease = [0.16, 1, 0.3, 1] as const;

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => {
    if (!isVisible) {
      clearTimers();
    }
    return clearTimers;
  }, [isVisible, clearTimers]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          {/* Single soft gradient orb — subtle, not distracting */}
          <motion.div
            animate={{
              opacity: [0.4, 0.6, 0.4],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute size-[500px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)',
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="relative"
          >
            <motion.div
              animate={{
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-6 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 60%)',
              }}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="size-20 sm:size-24 relative"
            >
              <Image
                src="/oasis-logo.png"
                alt="OASIS"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>

          {/* Brand name — fades in after logo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <h1 className="text-xl font-semibold tracking-[0.2em] text-foreground/80 uppercase">
              Oasis
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="text-[11px] tracking-[0.15em] text-muted-foreground mt-1.5 uppercase"
            >
              Encuentra tu oasis de salud
            </motion.p>
          </motion.div>

          {/* Minimal loading indicator — single line that grows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
            className="mt-10 w-32 h-[2px] rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden"
          >
            <motion.div
              className="h-full rounded-full bg-foreground/30"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
