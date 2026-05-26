'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'sidebar' | 'clay';
  hover?: boolean;
  onClick?: () => void;
  layoutId?: string;
  variants?: any;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hover = false,
  onClick,
  layoutId,
  variants,
}: GlassCardProps) {
  const cardClass = 
    variant === 'strong'
      ? 'glass-strong'
      : variant === 'sidebar'
      ? 'glass-sidebar'
      : variant === 'clay'
      ? 'clay-card'
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
      whileHover={hover ? {
        y: -5,
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0, 194, 160, 0.15)',
        transition: { type: 'spring', stiffness: 300, damping: 18 }
      } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      className={cn(
        cardClass,
        'rounded-3xl p-6 transition-all duration-300 border border-slate-200/50 dark:border-white/5 shadow-lg',
        (hover || onClick) && 'cursor-pointer select-none',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </motion.div>
  );
}
