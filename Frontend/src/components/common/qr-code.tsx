'use client';

import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 200, className }: QrCodeProps) {
  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="rounded-lg border-2 border-gray-200 bg-white p-2 shadow-sm">
        <QRCodeSVG value={value} size={size} level="M" includeMargin />
      </div>
      <p className="text-xs text-gray-500 font-medium">Código QR</p>
      <p className="text-[10px] text-gray-400 max-w-[200px] truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
