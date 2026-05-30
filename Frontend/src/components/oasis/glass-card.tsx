'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useSpatialGyro } from '@/hooks/use-spatial-gyro';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'sidebar';
  hover?: boolean;
  onClick?: () => void;
  layoutId?: string;
  variants?: any;
  spatial?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hover = false,
  onClick,
  layoutId,
  variants,
  spatial = false,
}: GlassCardProps) {
  // Invoca el hook reactivo de giroscopio de forma incondicional respetando las reglas de React Hooks
  useSpatialGyro(spatial);

  const glassClass = variant === 'strong'
    ? 'glass-strong'
    : variant === 'sidebar'
    ? 'glass-sidebar'
    : 'glass';

  return (
    <motion.div
      layout={!!layoutId}
      layoutId={layoutId}
      variants={variants}
      initial={variants ? undefined : { opacity: 0, y: 16 }}
      animate={variants ? undefined : { opacity: 1, y: 0 }}
      transition={{
        layout: { type: 'spring', stiffness: 200, damping: 25 },
        opacity: { duration: 0.3 },
        y: { duration: 0.3, ease: 'easeOut' },
      }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={cn(
        glassClass,
        spatial && 'spatial-card clarity-shield',
        'rounded-[20px] p-4 sm:p-6',
        hover && 'cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
