'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-[32px] border border-slate-200/60 dark:border-slate-800/40 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-rose-500/5 dark:bg-rose-500/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center size-16 rounded-[24px] bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-500 animate-pulse">
              <AlertTriangle className="size-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Algo no salió como esperábamos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Se detectó una excepción inesperada en el renderizado de la interfaz. Esto puede deberse a problemas de conectividad o datos temporales inconsistentes.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 rounded-2xl text-left">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Detalle del Error</p>
                <p className="text-[11px] font-mono text-slate-650 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.message || 'Error desconocido'}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(20,184,166,0.25)]"
            >
              <RefreshCw className="size-3.5" /> Reintentar y Cargar de Nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
