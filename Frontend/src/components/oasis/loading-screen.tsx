'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
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
        >
          {/* Spatial Aura Background with Liquid blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.2, 0.35, 0.2],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[-20%] right-[-10%] size-[600px] rounded-full bg-teal-500/10 blur-[50px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.12, 0.25, 0.12],
                rotate: [0, -90, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-[-15%] left-[-5%] size-[500px] rounded-full bg-sky-500/10 blur-[40px]"
            />
          </div>

          {/* Center Content */}
          <div className="relative flex flex-col items-center">
            {/* Liquid Glass Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-10 flex flex-col items-center justify-center rounded-[3rem] bg-white/[0.02] dark:bg-zinc-950/20 backdrop-blur-3xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.8),inset_1px_1px_4px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              {/* Internal pulse */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-teal-500 rounded-full blur-3xl pointer-events-none"
              />

              {/* Advanced Animated Logo */}
              <AnimatedLogo className="scale-125 mb-6" showLabel={false} />

              {/* Dynamic Loading Spinner Track */}
              <LoadingAnimation size="md" className="mt-2" />
            </motion.div>

            {/* Brand Identity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 text-center"
            >
              <h1 className="text-2xl font-black tracking-[0.3em] text-white uppercase bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                Oasis Aura
              </h1>
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-teal-400 to-transparent mx-auto mt-3" />
              <p className="text-[10px] tracking-[0.4em] text-teal-400/60 mt-4 uppercase font-bold">
                Tu refugio de salud digital
              </p>
              
              {/* Percentage count */}
              <p className="text-xs font-black text-teal-500/80 mt-2 font-mono tracking-widest">
                {progress}%
              </p>
            </motion.div>
          </div>

          {/* Bottom Loading Progress — Liquid Bar */}
          <div className="absolute bottom-20 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-teal-500 via-[#00C2A0] to-cyan-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeInOut' }}
            />
          </div>

          {/* Floating Drop Mascot */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-32 opacity-25 pointer-events-none"
          >
            <Droplets className="size-8 text-teal-400" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
