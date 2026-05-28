'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, ShieldCheck, Heart, Sparkles, Navigation, QrCode, Terminal } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  const logs = [
    'Estableciendo canal seguro criptográfico TLS 1.3...',
    'Iniciando firma digital HMAC-SHA256 para recetas...',
    'Cargando nodos de farmacia e inventarios locales...',
    'Sincronizando satélite GPS para rastreo satelital Nicaragua...',
    'Cifrando base de datos clínicos bajo estándares HIPAA...',
    'Inicializando interfaz sensorial Oasis Aura 2.0...',
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
        const step = Math.floor(Math.random() * 14) + 6;
        return Math.min(100, prev + step);
      });
    }, 120);

    const logInterval = setInterval(() => {
      setLogIndex((prev) => (prev < logs.length - 1 ? prev + 1 : prev));
    }, 900);

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
            scale: 1.06,
            filter: 'blur(12px)',
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#020405] overflow-hidden select-none"
        >
          {/* Futuristic Radar Grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a6_1px,transparent_1px),linear-gradient(to_bottom,#14b8a6_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]" />
          
          {/* Sweep sonar gradient effect */}
          <motion.div 
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-x-0 h-40 bg-gradient-to-b from-teal-500/0 via-teal-500/5 to-teal-500/0 pointer-events-none"
          />

          {/* Morphing Neon fluid blobs behind hud */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 0.9, 1],
                rotate: [0, 120, 240, 360],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1/4 -right-1/4 size-[550px] rounded-full bg-gradient-to-tr from-teal-500/10 to-cyan-500/20 blur-[90px]"
            />
            <motion.div
              animate={{
                scale: [1.1, 0.9, 1.2, 1.1],
                rotate: [360, 240, 120, 0],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-1/4 -left-1/4 size-[550px] rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/20 blur-[90px]"
            />
          </div>

          {/* Central Holographic HUD Container */}
          <div className="relative flex flex-col items-center justify-center max-w-lg w-full px-6">
            
            {/* The circular scanner scope */}
            <div className="relative size-60 flex items-center justify-center mb-8">
              
              {/* Outer rotating dashed scope */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-teal-500/25"
              />

              {/* Inner fast rotating scanning bracket ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full border-2 border-transparent border-t-teal-400/60 border-b-cyan-400/60"
              />

              {/* Active laser ring sweep */}
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-8 rounded-full border border-teal-500/30 bg-teal-500/[0.01]"
              />

              {/* Orbiting bio-particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6 + i * 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <div 
                    className="absolute size-2.5 rounded-full bg-teal-400/80 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                    style={{
                      top: '12%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </motion.div>
              ))}

              {/* High precision target indicator crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-6 w-px bg-teal-400/40" />
                <div className="w-6 h-px bg-teal-400/40" />
              </div>

              {/* Center Logo Floating Sphere */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative size-32 rounded-full bg-white/[0.01] dark:bg-zinc-950/20 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_1px_1px_4px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden"
              >
                <AnimatedLogo size="xl" showLabel={false} priority={true} />
              </motion.div>
            </div>

            {/* Kinetic Typography Label */}
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-sm font-black tracking-[0.6em] uppercase text-teal-400/70 font-mono flex items-center justify-center gap-1.5 pl-[0.6em]">
                OASIS BIOSCAN v2.0
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest font-mono">
                SISTEMA INTEGRAL DE SALUD NICARAGUA
              </p>
            </div>

            {/* Real-time Telemetry logs terminal */}
            <div className="w-full max-w-sm rounded-2xl bg-black/60 border border-teal-500/10 p-4 font-mono text-[9px] text-teal-500/80 space-y-2 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-2 right-4 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-[7px] text-red-400 font-black">HUD_SYS</span>
              </div>
              <div className="flex items-center gap-2 border-b border-teal-500/15 pb-2 text-[8px] uppercase tracking-wider font-black text-teal-400/70">
                <Terminal className="size-3" />
                Consola de Inicialización
              </div>
              <div className="h-16 flex flex-col justify-end overflow-hidden space-y-1.5">
                <p className="opacity-40">-- INICIANDO SECUENCIA BOOTSTRAP --</p>
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={logIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-teal-400 flex items-center gap-1.5"
                  >
                    <span className="text-[#00C2A0] font-black">&gt;&gt;</span>
                    {logs[logIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Holographic Embossed Progress Pill */}
            <div className="mt-8 flex flex-col items-center w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400 dark:text-zinc-400 font-mono tracking-wider">
                <span>VERIFICANDO FIRMAS QR</span>
                <span className="text-teal-400">{progress}%</span>
              </div>
              
              {/* Neon Progress Bar */}
              <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-teal-500 via-[#00C2A0] to-cyan-400 shadow-[0_0_8px_#2dd4bf] rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Glowing health compliance anchors */}
            <div className="mt-8 flex items-center gap-4 text-[9px] font-black tracking-widest text-slate-500 dark:text-zinc-500 uppercase">
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-teal-500" />
                MINSA_OK
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Heart className="size-3.5 text-rose-500 animate-pulse" />
                HIPAA_SECURE
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Navigation className="size-3.5 text-sky-500" />
                GPS_ACTIVE
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
