// ============================================
// OASIS - useActivePharmacyId Hook
// Resolves active pharmacy ID dynamically for managers and admins
// ============================================

import { useAuthStore } from '@/store/auth-store';
import { usePharmacies } from './use-api';

export function useActivePharmacyId() {
  const user = useAuthStore((s) => s.user);
  
  const managerPharmacyId = 
    user?.pharmacy_manager_profile?.pharmacy_id || 
    (user as any)?.pharmacyManagerProfile?.pharmacyId;
  
  const shouldFetchOwned = !managerPharmacyId && user?.role === 'pharmacy_admin';
  
  const { data: pharmaciesResult } = usePharmacies({});
  
  if (managerPharmacyId) return managerPharmacyId;
  
  if (user?.role === 'pharmacy_admin') {
    const owned = pharmaciesResult?.data?.find(
      (p: any) => p.ownerId === user.id || p.owner_id === user.id
    );
    return owned?.id || '';
  }
  
  return '';
}
