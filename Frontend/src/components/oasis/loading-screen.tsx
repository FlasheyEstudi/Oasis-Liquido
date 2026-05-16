'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Droplets } from 'lucide-react';

interface LoadingScreenProps {
  isVisible: boolean;
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* Spatial Aura Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-20%] right-[-10%] size-[600px] rounded-full bg-teal-500/10 blur-[40px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, -90, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[-15%] left-[-5%] size-[500px] rounded-full bg-sky-500/10 blur-[30px]"
            />
          </div>

          {/* Center Content */}
          <div className="relative flex flex-col items-center">
            {/* Rotating Aura Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-12 rounded-full border border-teal-500/20 border-t-teal-500/40 border-l-teal-500/40"
              style={{ filter: 'drop-shadow(0 0 15px rgba(20, 184, 166, 0.2))' }}
            />

            {/* Liquid Glass Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative size-32 sm:size-40 flex items-center justify-center rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Internal pulse */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-teal-500 rounded-full blur-2xl"
              />

              <div className="relative size-20 sm:size-24">
                <Image
                  src="/oasis-logo.png"
                  alt="OASIS"
                  fill
                  className="object-contain brightness-110 contrast-125"
                  priority
                />
              </div>

              {/* Water Drop Animation (CSS-based) */}
              <div className="absolute bottom-4 flex gap-1">
                <div className="size-1.5 rounded-full bg-teal-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="size-1.5 rounded-full bg-teal-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="size-1.5 rounded-full bg-teal-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
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
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent mx-auto mt-3" />
              <p className="text-[10px] tracking-[0.4em] text-teal-500/60 mt-4 uppercase font-bold">
                Tu refugio de salud digital
              </p>
            </motion.div>
          </div>

          {/* Bottom Loading Progress — Liquid Bar */}
          <div className="absolute bottom-20 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%", left: "-100%" }}
              animate={{ width: "100%", left: "100%" }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-teal-500 to-transparent"
            />
          </div>

          {/* Floating Drop Mascot Placeholder (The "Zumbi" Aura feeling) */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 opacity-20 pointer-events-none"
          >
            <Droplets className="size-8 text-teal-500" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

