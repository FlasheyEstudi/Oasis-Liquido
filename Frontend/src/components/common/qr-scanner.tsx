'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QrScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

// Unique ID counter for scanner regions
let scannerIdCounter = 0;

export function QrScanner({ onScan, onError, isActive }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionIdRef = useRef<string>(`qr-scanner-region-${++scannerIdCounter}`);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 /* SCANNING */) {
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore stop errors
      }
      try {
        scannerRef.current.clear();
      } catch {
        // Ignore clear errors
      }
      scannerRef.current = null;
    }
    if (mountedRef.current) {
      setScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current) {
      // Already scanning
      return;
    }

    setError(null);
    setScanning(true);

    try {
      const regionId = regionIdRef.current;
      const html5QrCode = new Html5Qrcode(regionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code detected
          onScan(decodedText);
        },
        () => {
          // QR code not found in frame (normal, ignore)
        }
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (mountedRef.current) {
        if (errorMessage.includes('Permission') || errorMessage.includes('denied') || errorMessage.includes('NotAllowedError')) {
          setError('Permiso de cámara denegado. Habilita el acceso a la cámara en la configuración.');
        } else if (errorMessage.includes('NotFound') || errorMessage.includes('Requested device not found')) {
          setError('No se encontró una cámara. Verifica que tu dispositivo tenga cámara.');
        } else {
          setError('Error al iniciar la cámara. Intenta de nuevo.');
        }
        setScanning(false);
        scannerRef.current = null;
        onError?.(errorMessage);
      }
    }
  }, [onScan, onError]);

  // Handle isActive changes
  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [isActive, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {
          // Ignore
        }
        try {
          scannerRef.current.clear();
        } catch {
          // Ignore
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Scanner viewport */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-colors',
          scanning ? 'border-emerald-400' : 'border-gray-200',
          !isActive && 'opacity-50'
        )}
        style={{ minHeight: 280 }}
      >
        {/* html5-qrcode renders video here */}
        <div id={regionIdRef.current} className="w-full" />

        {/* Scanning overlay with animated line */}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-emerald-500 rounded-tl" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-emerald-500 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-emerald-500 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-emerald-500 rounded-br" />

            {/* Animated scan line */}
            <div className="absolute left-4 right-4 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] qr-scan-line" />
          </div>
        )}

        {/* Not active placeholder */}
        {!isActive && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-20">
            <Camera className="size-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-300 font-medium">Cámara inactiva</p>
          </div>
        )}

        {/* Loading state */}
        {isActive && !scanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-20">
            <Loader2 className="size-8 text-emerald-400 animate-spin mb-2" />
            <p className="text-sm text-gray-300">Iniciando cámara...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20 p-6">
            <AlertCircle className="size-10 text-red-400 mb-3" />
            <p className="text-sm text-red-300 font-medium text-center">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4 border-red-400 text-red-300 hover:bg-red-900/50"
              onClick={() => {
                setError(null);
                startScanner();
              }}
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div
          className={cn(
            'size-2 rounded-full',
            scanning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
          )}
        />
        <p className="text-xs text-gray-500">
          {scanning ? 'Escaneando...' : 'Esperando cámara'}
        </p>
      </div>
    </div>
  );
}
