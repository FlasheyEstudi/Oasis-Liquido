// Frontend/src/hooks/useFamilyContext.ts
import { useFamily } from '@/contexts/FamilyContext';

/**
 * Custom hook to easily consume the FamilyContext
 */
export function useFamilyContext() {
  return useFamily();
}
