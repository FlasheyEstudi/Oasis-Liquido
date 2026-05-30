'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  type: 'card' | 'list' | 'detail' | 'table';
  count?: number;
}

export function LoadingSkeleton({ type, count = 3 }: LoadingSkeletonProps) {
  switch (type) {
    case 'card':
      return <CardSkeleton count={count} />;
    case 'list':
      return <ListSkeleton count={count} />;
    case 'detail':
      return <DetailSkeleton />;
    case 'table':
      return <TableSkeleton count={count} />;
    default:
      return <CardSkeleton count={count} />;
  }
}

// --- Premium Card Skeleton (Spatial Glassmorphism 3.0 style) ---
function CardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="relative overflow-hidden rounded-[2.5rem_1.2rem_2.2rem_1.5rem] border border-slate-200/50 dark:border-white/5 bg-gradient-to-br from-white/60 to-white/30 dark:from-zinc-950/30 dark:to-zinc-950/15 p-6 backdrop-blur-xl shadow-xl space-y-4"
        >
          {/* Subtle glowing radial overlay */}
          <div className="absolute -right-8 -top-8 size-24 rounded-full bg-teal-500/5 dark:bg-teal-400/5 blur-2xl pointer-events-none" />
          
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
          
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3.5 w-full rounded-full" />
            <Skeleton className="h-3.5 w-5/6 rounded-full" />
          </div>
          
          <div className="flex gap-2 pt-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Premium List Skeleton (Borderless/Glassy items style) ---
function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-[2rem_0.8rem_1.8rem_1rem] border border-slate-200/30 dark:border-white/5 bg-white/40 dark:bg-zinc-950/20 p-4 backdrop-blur-lg shadow-sm"
        >
          <Skeleton className="size-11 shrink-0 rounded-2xl" />
          
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-3.5 w-2/3 rounded-full" />
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Premium Detail Skeleton (Asymmetric layout) ---
function DetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-500/5 via-white/20 to-emerald-500/5 dark:from-teal-500/5 dark:via-zinc-950/20 dark:to-emerald-500/5 p-6 sm:p-8 border border-slate-200/50 dark:border-white/5 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <Skeleton className="size-16 shrink-0 rounded-[20px_10px_18px_12px]" />
        
        <div className="flex-1 space-y-3 text-center sm:text-left w-full">
          <Skeleton className="h-6 w-2/5 mx-auto sm:mx-0 rounded-full" />
          <Skeleton className="h-4 w-3/5 mx-auto sm:mx-0 rounded-full" />
          <div className="flex justify-center sm:justify-start gap-2 pt-1">
            <Skeleton className="h-6.5 w-24 rounded-full" />
            <Skeleton className="h-6.5 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Grid Content Sections */}
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="space-y-4 rounded-[2rem_1rem_1.8rem_1.2rem] border border-slate-200/40 dark:border-white/5 bg-white/30 dark:bg-zinc-950/15 p-5 backdrop-blur-lg shadow-inner"
          >
            <Skeleton className="h-4 w-1/4 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full rounded-full" />
              <Skeleton className="h-3.5 w-4/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Inner List/Table area */}
      <div className="space-y-3 p-5 rounded-[2.2rem] border border-slate-200/40 dark:border-white/5 bg-white/20 dark:bg-zinc-950/10 backdrop-blur-md">
        <Skeleton className="h-5 w-1/4 rounded-full mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2 border-b border-dashed border-slate-200/50 dark:border-white/5 last:border-0">
            <Skeleton className="h-4.5 flex-1 rounded-full" />
            <Skeleton className="h-4.5 w-20 rounded-full" />
            <Skeleton className="h-4.5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Premium Table Skeleton ---
function TableSkeleton({ count }: { count: number }) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200/40 dark:border-white/5 bg-white/30 dark:bg-zinc-950/15 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Table header */}
      <div className="flex gap-4 border-b border-dashed border-slate-200/50 dark:border-white/5 p-4.5 bg-slate-500/[0.02]">
        <Skeleton className="h-4 flex-1 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-dashed divide-slate-200/30 dark:divide-white/5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4.5">
            <Skeleton className="h-4 flex-1 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8.5 w-12 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
