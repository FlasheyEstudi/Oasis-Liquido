'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton animate-pulse bg-slate-200/50 dark:bg-white/[0.03]',
        variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'h-4 rounded-md w-3/4' : 'rounded-2xl',
        className
      )}
      aria-hidden="true"
    />
  );
}

/* --- DASHBOARD STATS LOADING SKELETON --- */
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-3xl p-5 space-y-3">
          <Skeleton className="size-8" variant="circular" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-16" variant="text" />
            <Skeleton className="h-3.5 w-24" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- LIST VIEW LOADING SKELETON --- */
export function SkeletonList({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: items }).map((_, idx) => (
        <div key={idx} className="glass rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="size-11" variant="circular" />
            <div className="space-y-2 flex-1 max-w-md">
              <Skeleton className="h-4 w-1/3" variant="text" />
              <Skeleton className="h-3 w-1/2" variant="text" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/* --- GRID VIEW / BENTO CARDS LOADING SKELETON --- */
export function SkeletonGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="size-12" variant="circular" />
            <Skeleton className="h-5 w-16 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" variant="text" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-5/6" variant="text" />
          </div>
          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- PROFILE / SCREEN DETAIL LOADING SKELETON --- */
export function SkeletonProfile() {
  return (
    <div className="glass rounded-3xl p-6 sm:p-8 space-y-6 w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-border/40">
        <Skeleton className="size-24 sm:size-28" variant="circular" />
        <div className="space-y-3 text-center sm:text-left flex-1">
          <Skeleton className="h-6 w-48 mx-auto sm:mx-0" variant="text" />
          <Skeleton className="h-4 w-32 mx-auto sm:mx-0" variant="text" />
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" variant="text" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
