// ============================================
// OASIS - Auth Store (Zustand)
// Gestiona estado de autenticación, usuario actual y navegación
// ============================================

import { create } from 'zustand';
import type { User, AppPage, UserRole } from '@/types';
import { setAccessToken, getAccessToken, clearAuthTokens } from '@/api/client';
import { getMe, refreshToken, logout as apiLogout } from '@/api/auth';

// Safe localStorage wrapper to prevent crashing on quota limits or private browsing mode
function safeLocalStorageSet(key: string, value: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`LocalStorage write failed for key "${key}":`, e);
  }
}

function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`LocalStorage read failed for key "${key}":`, e);
  }
  return null;
}

function safeLocalStorageRemove(key: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`LocalStorage remove failed for key "${key}":`, e);
  }
}

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  currentPage: AppPage;
  selectedItemId: string | null;
  prescriptionId: string | null;
  notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string } | null;

  representedUser: User | null;
  originalAccessToken: string | null;
  isElderlyMode: boolean;

  // Acciones
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  navigate: (page: AppPage, itemId?: string | null) => void;
  setPrescriptionId: (id: string | null) => void;
  setNotification: (notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string } | null) => void;
  hydrate: () => Promise<void>;
  setRepresentedUser: (user: User | null) => void;
  toggleElderlyMode: () => void;

  // Helpers
  getRoleHome: () => AppPage;
}

/** Obtiene la página home según el rol */
function getHomeForRole(role: UserRole): AppPage {
  switch (role) {
    case 'admin': return 'inicio';
    case 'clinic_admin': return 'gestionar-clinicas';
    case 'pharmacy_admin': return 'gestionar-farmacias';
    case 'doctor': return 'inicio';
    case 'receptionist': return 'inicio';
    case 'patient': return 'inicio';
    case 'pharmacy_manager':
    case 'cashier': return 'inicio';
    case 'delivery_driver': return 'inicio-repartidor';
    default: return 'inicio';
  }
}

/** Normalizes user details */
function normalizeUser(user: User | null): User | null {
  return user;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado inicial
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  currentPage: 'bienvenida',
  selectedItemId: null,
  prescriptionId: null,
  notification: null,
  representedUser: null,
  originalAccessToken: null,
  isElderlyMode: false,

  setUser: (user) => {
    const normalized = normalizeUser(user);
    set({ user: normalized, isAuthenticated: !!normalized });
  },

  login: (user, accessToken) => {
    setAccessToken(accessToken);
    const normalized = normalizeUser(user);
    const homePage = getHomeForRole(normalized?.role || user.role);
    set({
      user: normalized,
      isAuthenticated: true,
      isLoading: false,
      currentPage: homePage,
      notification: { type: 'success', message: `Bienvenido a OASIS, ${user.name}` },
    });
  },

  logout: () => {
    // Clear cookies/session on backend as well
    apiLogout().catch((err) => {
      console.warn('OASIS: Backend session revocation deferred:', err.message);
    });
    
    clearAuthTokens();
    safeLocalStorageRemove('oasis_selected_item_id');
    safeLocalStorageRemove('oasis_prescription_id');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      currentPage: 'bienvenida',
      selectedItemId: null,
      prescriptionId: null,
      notification: null,
      representedUser: null,
    });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('elderly-mode');
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  navigate: (currentPage, selectedItemId = null) => {
    if (selectedItemId) {
      safeLocalStorageSet('oasis_selected_item_id', selectedItemId);
    } else {
      const isDetailPage = [
        'prescription-detail', 'detalle-receta',
        'delivery-request', 'solicitud-envio',
        'delivery-detail', 'detalle-envio',
        'appointment-detail', 'detalle-cita',
        'consultation', 'consulta'
      ].includes(currentPage);
      if (!isDetailPage) {
        safeLocalStorageRemove('oasis_selected_item_id');
      }
    }
    set({ 
      currentPage, 
      selectedItemId: selectedItemId || safeLocalStorageGet('oasis_selected_item_id') 
    });
  },

  setPrescriptionId: (prescriptionId) => {
    if (prescriptionId) {
      safeLocalStorageSet('oasis_prescription_id', prescriptionId);
    } else {
      safeLocalStorageRemove('oasis_prescription_id');
    }
    set({ prescriptionId });
  },

  setNotification: (notification) => {
    set({ notification });
    if (notification) {
      setTimeout(() => {
        set({ notification: null });
      }, 4000);
    }
  },

  setRepresentedUser: async (representedUser) => {
    const { originalAccessToken } = get();

    if (!representedUser) {
      // Restore original caregiver user token
      if (originalAccessToken) {
        setAccessToken(originalAccessToken);
      }
      set({ representedUser: null, originalAccessToken: null });
      return;
    }

    try {
      set({ isLoading: true });

      // Dynamically load family api to avoid circular dependency
      const { actAsFamily } = await import('@/api/family');
      const res = await actAsFamily(representedUser.id);

      // Save current caregiver token if not already in memory
      const currentToken = getAccessToken();
      const savedToken = originalAccessToken || currentToken;

      setAccessToken(res.token);
      set({
        representedUser: {
          ...representedUser,
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
        },
        originalAccessToken: savedToken,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error switching representation context:', err);
      set({ isLoading: false });
    }
  },

  toggleElderlyMode: () => {
    const next = !get().isElderlyMode;
    set({ isElderlyMode: next });
    if (typeof window !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('elderly-mode');
      } else {
        document.documentElement.classList.remove('elderly-mode');
      }
    }
  },

  hydrate: async () => {
    if (typeof window === 'undefined') return;
    
    // Check if the current URL is a public verification route
    const path = window.location.pathname.replace('/', '');
    const isPublicVerifyRoute = path.startsWith('verificar-venta-') || 
                                path.startsWith('verificar-receta-') || 
                                path.startsWith('verificar-paciente-');

    set({ isLoading: true });
    try {
      // Try to refresh the token using the httpOnly cookie
      const { access_token } = await refreshToken();
      setAccessToken(access_token);
      
      // If refresh succeeded, get the user profile
      const user = await getMe();
      const normalized = normalizeUser(user);
      const homePage = getHomeForRole(normalized?.role || user.role);
      
      const savedItemId = safeLocalStorageGet('oasis_selected_item_id');
      const savedPrescriptionId = safeLocalStorageGet('oasis_prescription_id');
      
      set({
        user: normalized,
        isAuthenticated: true,
        isHydrated: true,
        isLoading: false,
        currentPage: isPublicVerifyRoute ? (path as any) : homePage,
        selectedItemId: savedItemId,
        prescriptionId: savedPrescriptionId,
      });
    } catch (error) {
      // No active session or refresh failed
      set({
        user: null,
        isAuthenticated: false,
        isHydrated: true,
        isLoading: false,
        currentPage: isPublicVerifyRoute ? (path as any) : 'bienvenida',
      });
    }
  },

  getRoleHome: () => {
    const { user } = get();
    if (!user) return 'entrar';
    return getHomeForRole(user.role);
  },
}));

// Escuchar expiración de token y actualizaciones de roles de forma global
if (typeof window !== 'undefined') {
  window.addEventListener('auth:expired', () => {
    useAuthStore.getState().logout();
  });

  window.addEventListener('auth:roles-updated', async () => {
    try {
      const user = await getMe();
      const normalized = normalizeUser(user);
      if (normalized) {
        const homePage = getHomeForRole(normalized.role);
        const currentRole = useAuthStore.getState().user?.role;
        
        useAuthStore.setState({
          user: normalized,
          isAuthenticated: true,
        });

        // Redirect if the role has changed to prevent dashboard rendering breakdown
        if (normalized.role !== currentRole) {
          useAuthStore.getState().navigate(homePage);
          useAuthStore.getState().setNotification({
            type: 'info',
            message: `Tu rol y permisos han sido actualizados por el Administrador. Redirigiendo...`,
          });
        }
      }
    } catch (err) {
      console.warn('OASIS: Failed to sync reactively after role update event:', err);
    }
  });
}

