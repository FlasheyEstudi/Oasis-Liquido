// Frontend/src/app/family/manage/page.tsx
'use client';

import { FamilyList } from '@/components/family/FamilyList';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import { PlusCircle, KeyRound, Heart, ArrowLeft, RefreshCw, UserCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useFamily } from '@/contexts/FamilyContext';

export default function FamilyManagePage() {
  const { navigate } = useAuthStore();
  const { activeDependent, switchToSupervisor, isActingAsDependent } = useFamily();

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 md:py-12 overflow-hidden flex flex-col items-center">
      <OrganicBlobs />

      <div className="relative z-10 w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/40">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Heart className="h-6 w-6 text-teal-500 fill-teal-500/10" />
              Oasis Familiar
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Gestiona los vínculos de salud con tus seres queridos y supervisa sus tratamientos.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('family/request')}
              className="glass-btn-primary h-10 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Agregar Miembro
            </button>
            <button
              onClick={() => navigate('family/verify')}
              className="glass-btn h-10 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-muted/80 transition-all"
            >
              <KeyRound className="h-4 w-4 text-indigo-500" />
              Tengo un Código
            </button>
          </div>
        </div>

        {/* Active acting-as banner */}
        {isActingAsDependent && activeDependent && (
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-600">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground block leading-none">Actuando en nombre de:</span>
                <strong className="text-sm text-foreground block mt-1">{activeDependent.name}</strong>
              </div>
            </div>
            <button
              onClick={switchToSupervisor}
              className="glass-btn h-8 px-3 rounded-full text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-pulse" />
              Volver a mi cuenta
            </button>
          </div>
        )}

        {/* Family list component */}
        <FamilyList />
      </div>
    </div>
  );
}
