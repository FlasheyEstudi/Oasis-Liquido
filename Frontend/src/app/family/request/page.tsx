// Frontend/src/app/family/request/page.tsx
'use client';

import { SendInvitation } from '@/components/family/SendInvitation';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function FamilyRequestPage() {
  const { navigate } = useAuthStore();

  return (
    <div className="relative min-h-screen py-10 px-4 overflow-hidden flex flex-col items-center justify-center">
      <OrganicBlobs />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('family/manage')}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group mb-2"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a gestión familiar
        </button>

        {/* Component */}
        <SendInvitation />
      </div>
    </div>
  );
}
