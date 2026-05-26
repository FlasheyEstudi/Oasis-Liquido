'use client';

import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingAnimationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingAnimation({ className, size = 'md' }: LoadingAnimationProps) {
  const dimension = {
    sm: 'size-12',
    md: 'size-20',
    lg: 'size-28',
  };

  const iconSize = {
    sm: 'size-5',
    md: 'size-8',
    lg: 'size-12',
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Specular fluid morphing ring */}
      <div className={cn('absolute inset-0 flex items-center justify-center', dimension[size])}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-teal-500/20 dark:text-teal-400/10 pointer-events-none"
        >
          <motion.path
            d="M30,50 C30,30 35,30 50,30 C65,30 70,30 70,50 C70,70 65,70 50,70 C35,70 30,70 30,50 Z"
            animate={{
              d: [
                "M30,50 C30,30 35,30 50,30 C65,30 70,30 70,50 C70,70 65,70 50,70 C35,70 30,70 30,50 Z",
                "M35,50 C35,28 40,25 50,25 C60,25 65,28 65,50 C65,72 58,75 50,75 C42,75 35,72 35,50 Z",
                "M28,50 C28,32 38,28 50,28 C62,28 72,32 72,50 C72,68 62,72 50,72 C38,72 28,68 28,50 Z",
                "M30,50 C30,30 35,30 50,30 C65,30 70,30 70,50 C70,70 65,70 50,70 C35,70 30,70 30,50 Z"
              ],
              rotate: 360
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* Rotating gradient track */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'rounded-full border-2 border-transparent border-t-teal-500 border-r-cyan-400',
          dimension[size]
        )}
        style={{
          boxShadow: '0 0 20px rgba(0, 194, 160, 0.15)',
          filter: 'blur(0.5px)'
        }}
      />

      {/* Center bouncing water droplet */}
      <motion.div
        animate={{
          scale: [0.9, 1.15, 0.9],
          opacity: [0.75, 1, 0.75],
          y: [0, -4, 0]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn('absolute text-teal-500 dark:text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]', iconSize[size])}
      >
        <Droplets className="fill-current w-full h-full" />
      </motion.div>
    </div>
  );
}
