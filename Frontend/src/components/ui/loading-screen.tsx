'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
  tagline?: string;
}

export function LoadingScreen({ isVisible, tagline = 'Tu refugio de salud digital' }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        const step = Math.floor(Math.random() * 15) + 5;
        return Math.min(100, prev + step);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#030606] overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Cargando Oasis Nicaragua"
        >
          {/* Spatial Aura Background with Liquid blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.2, 0.35, 0.2],
                rotate: [0, 120, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[-25%] right-[-15%] size-[650px] rounded-full bg-teal-500/10 blur-[60px]"
            />
            <motion.div
              animate={{
                scale: [1.3, 1, 1.3],
                opacity: [0.12, 0.25, 0.12],
                rotate: [0, -120, 0],
              }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-[-20%] left-[-10%] size-[550px] rounded-full bg-cyan-500/10 blur-[50px]"
            />
          </div>

          {/* Core Content Box */}
          <div className="relative flex flex-col items-center">
            {/* Specular Claymorphism Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-10 flex flex-col items-center justify-center rounded-[3rem] bg-white/[0.02] dark:bg-zinc-950/20 backdrop-blur-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.7),inset_1px_1px_4px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              {/* Internal glow */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.12, 0.25, 0.12] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute inset-0 bg-teal-500 rounded-full blur-3xl"
              />

              {/* Advanced Animated Logo */}
              <motion.div 
                animate={{
                  scale: [1.2, 1.26, 1.2],
                  filter: ['drop-shadow(0 0 15px rgba(20,184,166,0.2))', 'drop-shadow(0 0 30px rgba(20,184,166,0.4))', 'drop-shadow(0 0 15px rgba(20,184,166,0.2))']
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative mb-2 flex items-center justify-center transition-all duration-300 z-10"
              >
                <AnimatedLogo priority showLabel={false} />
              </motion.div>
            </motion.div>

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="mt-12 text-center select-none"
            >
              <h1 className="text-2xl font-black tracking-[0.25em] text-white uppercase bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent">
                Oasis Aura
              </h1>
              <div className="h-[2px] w-14 bg-gradient-to-r from-transparent via-teal-400 to-transparent mx-auto mt-4" />
              <p className="text-[10px] tracking-[0.35em] text-teal-400/70 mt-5 uppercase font-extrabold">
                {tagline}
              </p>
              
              {/* Percentage count */}
              <p className="text-xs font-black text-teal-500/80 mt-2 font-mono tracking-widest">
                {progress}%
              </p>
            </motion.div>
          </div>

          {/* Bottom Progress loader bar */}
          <div className="absolute bottom-24 w-52 h-1 bg-white/5 rounded-full overflow-hidden" aria-hidden="true">
            <motion.div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-teal-500 via-[#00C2A0] to-cyan-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeInOut' }}
            />
          </div>

          {/* Water drop float emblem */}
          <motion.div
            animate={{ 
              y: [0, -12, 0],
              rotate: [0, 6, 0]
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-36 opacity-30 pointer-events-none"
            aria-hidden="true"
          >
            <Droplets className="size-9 text-teal-400" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
