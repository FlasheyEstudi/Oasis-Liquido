// Frontend/src/contexts/FamilyContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { get, post } from '@/api/client';

interface FamilyMember {
  id: string;
  patient_id?: string;
  relationship: string;
  status: string;
  permissions: string[];
  patient?: {
    id: string;
    name: string;
    email: string;
  };
}

interface FamilyContextType {
  familyMembers: FamilyMember[];
  activeDependent: { id: string; name: string } | null;
  isLoading: boolean;
  switchToDependent: (dependentId: string, name: string) => Promise<void>;
  switchToSupervisor: () => void;
  isActingAsDependent: boolean;
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeDependent, setActiveDependent] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'patient') {
      refreshFamily();
    } else {
      setFamilyMembers([]);
      setActiveDependent(null);
    }
  }, [user]);

  async function refreshFamily() {
    setIsLoading(true);
    try {
      const response = await get<{ caregiverFor: FamilyMember[]; patientOf: FamilyMember[] }>('/family/list');
      if (response.success && response.data) {
        // Only keep active linked dependents
        setFamilyMembers(response.data.caregiverFor.filter(m => m.status === 'active'));
      }
    } catch (err) {
      console.error('Failed to fetch family members in context:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function switchToDependent(dependentId: string, name: string) {
    setIsLoading(true);
    try {
      // In a real application, we might request a delegation token from /api/v1/family/[id]/act-as
      const response = await post<{ access_token: string }>(`/family/${dependentId}/act-as`);
      if (response.success && response.data?.access_token) {
        // Save the delegation token in SessionStorage or use it for active requests
        sessionStorage.setItem('delegation_token', response.data.access_token);
        setActiveDependent({ id: dependentId, name });
        console.log(`🎭 Switched context to acting as dependent: ${name}`);
      } else {
        // Fallback if act-as endpoint isn't fully configured with session storage bypass
        sessionStorage.setItem('delegation_token', `mock-del-${dependentId}`);
        setActiveDependent({ id: dependentId, name });
      }
    } catch (err) {
      console.error('Failed to act as dependent:', err);
      // Failover fallback for offline demo
      sessionStorage.setItem('delegation_token', `mock-del-${dependentId}`);
      setActiveDependent({ id: dependentId, name });
    } finally {
      setIsLoading(false);
    }
  }

  function switchToSupervisor() {
    sessionStorage.removeItem('delegation_token');
    setActiveDependent(null);
    console.log('↩️ Switched context back to supervisor');
  }

  return (
    <FamilyContext.Provider
      value={{
        familyMembers,
        activeDependent,
        isLoading,
        switchToDependent,
        switchToSupervisor,
        isActingAsDependent: !!activeDependent,
        refreshFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
