'use client';

import { motion } from 'framer-motion';

export function HeroBlob() {
  return (
    <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center shrink-0">
      {/* Dynamic Back Auras */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 rounded-full blur-[80px] opacity-40 dark:opacity-30 animate-pulse duration-[8000ms]" />

      {/* Floating morphing blob container */}
      <motion.div
        animate={{
          borderRadius: [
            '42% 58% 70% 30% / 45% 45% 55% 55%',
            '70% 30% 52% 48% / 60% 40% 60% 40%',
            '45% 55% 48% 52% / 40% 60% 50% 50%',
            '42% 58% 70% 30% / 45% 45% 55% 55%',
          ],
          rotate: [0, 90, 180, 360],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-[85%] h-[85%] bg-gradient-to-br from-teal-500/80 via-emerald-400/70 to-cyan-600/80 dark:from-teal-400/60 dark:via-emerald-500/50 dark:to-cyan-500/60 backdrop-blur-[2px] shadow-[inset_-12px_-12px_32px_rgba(0,0,0,0.1),_inset_12px_12px_32px_rgba(255,255,255,0.4)] dark:shadow-[inset_-12px_-12px_32px_rgba(0,0,0,0.3),_inset_12px_12px_32px_rgba(255,255,255,0.05)] border border-white/20 dark:border-white/5 relative overflow-hidden"
      >
        {/* Shimmer light reflect line */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
            y: ['-100%', '200%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent w-[50%] h-[200%] rotate-45 pointer-events-none"
        />

        {/* Specular high-contrast core */}
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[30%] rounded-full bg-white/40 dark:bg-white/10 blur-[10px] pointer-events-none" />
      </motion.div>

      {/* Floating bubbles (specular particles) */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-12 right-12 w-16 h-16 rounded-full bg-cyan-400/20 backdrop-blur-md border border-white/20 shadow-lg pointer-events-none"
      />

      <motion.div
        animate={{
          y: [12, -12, 12],
          x: [6, -6, 6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-8 left-10 w-20 h-20 rounded-full bg-emerald-400/25 backdrop-blur-md border border-white/20 shadow-lg pointer-events-none"
      />
    </div>
  );
}
