'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MascotaIconProps {
  /** Size of the icon: sm, md, lg */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classnames */
  className?: string;
}

/**
 * Displays the mascot image (mascota.png) from the public assets.
 * Used throughout the UI (landing, login, register) and as the PWA icon.
 */
export function MascotaIcon({ size = 'md', className }: MascotaIconProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };
  return (
    <div className={cn('relative', sizes[size], className)}>
      <Image
        src="/images/nuevo logo y mascota/mascota.png"
        alt="Mascota Oasis"
        width={256}
        height={256}
        priority
        className="object-contain rounded-full"
      />
    </div>
  );
}
