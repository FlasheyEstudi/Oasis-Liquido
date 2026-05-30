'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Heart, Sparkles, Activity, Compass } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  const logs = [
    'Estableciendo canal seguro de salud...',
    'Inicializando firmas digitales HMAC-SHA256...',
    'Cargando inventarios de farmacia locales...',
    'Verificando posicionamiento satelital...',
    'Cifrando datos médicos bajo HIPAA...',
    'Iniciando Oasis Aura...',
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setLogIndex(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const step = Math.floor(Math.random() * 15) + 8;
        return Math.min(100, prev + step);
      });
    }, 100);

    const logInterval = setInterval(() => {
      setLogIndex((prev) => (prev < logs.length - 1 ? prev + 1 : prev));
    }, 850);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.04,
            filter: 'blur(8px)',
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#030606] text-slate-800 dark:text-zinc-100 overflow-hidden select-none transition-colors duration-300"
        >
          {/* Soft Elegant Ambient Lights */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.1, 0.18, 0.1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1/4 -right-1/4 size-[500px] rounded-full bg-gradient-to-tr from-teal-500/10 to-emerald-500/10 blur-[100px] dark:from-teal-500/5 dark:to-emerald-500/5"
            />
            <motion.div
              animate={{
                scale: [1.1, 0.95, 1.1],
                opacity: [0.08, 0.15, 0.08],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-1/4 -left-1/4 size-[500px] rounded-full bg-gradient-to-br from-cyan-500/10 to-teal-500/10 blur-[100px] dark:from-cyan-500/5 dark:to-teal-500/5"
            />
          </div>

          {/* Central Elegant Container */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-sm w-full px-8 text-center">
            
            {/* Pulsing Breathing Aura around Logo */}
            <div className="relative size-44 flex items-center justify-center mb-8">
              
              {/* Outer soft breathing circle */}
              <motion.div
                animate={{ 
                  scale: [0.92, 1.08, 0.92],
                  opacity: [0.15, 0.35, 0.15] 
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-md"
              />
              
              <motion.div
                animate={{ 
                  scale: [0.96, 1.04, 0.96],
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute inset-4 rounded-full border border-teal-500/20 dark:border-teal-400/10"
              />

              {/* Elegant floating glass center */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative size-32 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/60 dark:border-zinc-800/40 shadow-[0_12px_32px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden"
              >
                <AnimatedLogo size="xl" showLabel={false} priority={true} />
              </motion.div>
            </div>

            {/* Typography Header */}
            <div className="space-y-1.5 mb-8">
              <h2 className="text-xs font-black tracking-[0.4em] uppercase text-teal-600 dark:text-teal-400 pl-[0.4em]">
                Oasis Aura
              </h2>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest">
                Ecosistema de Salud Digital
              </p>
            </div>

            {/* Premium minimal status display */}
            <div className="w-full rounded-2xl bg-white/50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-900/60 p-4 shadow-sm backdrop-blur-md">
              <div className="h-8 flex flex-col justify-center items-center">
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={logIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5 justify-center"
                  >
                    <Sparkles className="size-3.5 text-teal-500 animate-spin-slow shrink-0" />
                    {logs[logIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Premium Minimalist Progress Bar */}
            <div className="mt-8 flex flex-col items-center w-full max-w-[240px] space-y-2">
              <div className="flex items-center justify-between w-full text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 tracking-widest uppercase">
                <span>Cargando</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-black">{progress}%</span>
              </div>
              
              <div className="w-full h-1 bg-slate-200 dark:bg-zinc-900 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Glowing health compliance anchors */}
            <div className="mt-10 flex items-center justify-center gap-4 text-[8px] font-black tracking-widest text-slate-400 dark:text-zinc-600 uppercase">
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-teal-500" />
                VERIFICADO OASIS
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Heart className="size-3 text-emerald-500 animate-pulse" />
                HIPAA SECURE
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Compass className="size-3 text-sky-500" />
                GPS ACTIVO
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
