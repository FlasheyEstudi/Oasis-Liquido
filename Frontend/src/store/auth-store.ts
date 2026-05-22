// ============================================
// OASIS - Auth Store (Zustand)
// Gestiona estado de autenticación, usuario actual y navegación
// ============================================

import { create } from 'zustand';
import type { User, AppPage, UserRole } from '@/types';
import { setAccessToken, getAccessToken, clearAuthTokens } from '@/api/client';
import { getMe, refreshToken } from '@/api/auth';

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  currentPage: AppPage;
  selectedItemId: string | null;
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
    case 'clinic_admin':
    case 'clinic_owner': return 'gestionar-clinicas';
    case 'pharmacy_admin':
    case 'pharmacy_owner': return 'gestionar-farmacias';
    case 'doctor': return 'inicio';
    case 'receptionist': return 'inicio';
    case 'patient': return 'inicio';
    case 'pharmacy_manager': return 'inicio';
    case 'delivery_driver': return 'inicio-repartidor';
    default: return 'inicio';
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado inicial
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  currentPage: 'bienvenida',
  selectedItemId: null,
  notification: null,
  representedUser: null,
  originalAccessToken: null,
  isElderlyMode: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: (user, accessToken) => {
    setAccessToken(accessToken);
    const homePage = getHomeForRole(user.role);
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      currentPage: homePage,
      notification: { type: 'success', message: `Bienvenido a OASIS, ${user.name}` },
    });
  },

  logout: () => {
    clearAuthTokens();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      currentPage: 'bienvenida',
      selectedItemId: null,
      notification: null,
      representedUser: null,
    });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('elderly-mode');
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  navigate: (currentPage, selectedItemId = null) => {
    set({ currentPage, selectedItemId });
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
    
    set({ isLoading: true });
    try {
      // Try to refresh the token using the httpOnly cookie
      const { access_token } = await refreshToken();
      setAccessToken(access_token);
      
      // If refresh succeeded, get the user profile
      const user = await getMe();
      const homePage = getHomeForRole(user.role);
      
      set({
        user,
        isAuthenticated: true,
        isHydrated: true,
        isLoading: false,
        currentPage: homePage,
      });
    } catch (error) {
      // No active session or refresh failed
      set({
        user: null,
        isAuthenticated: false,
        isHydrated: true,
        isLoading: false,
        currentPage: 'bienvenida',
      });
    }
  },

  getRoleHome: () => {
    const { user } = get();
    if (!user) return 'entrar';
    return getHomeForRole(user.role);
  },
}));
