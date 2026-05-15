'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBlockProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBlock({ message, onRetry }: ErrorBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="size-8 text-red-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900">
        Ocurrió un error
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
