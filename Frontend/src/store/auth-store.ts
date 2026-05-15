// ============================================
// OASIS - Auth Store (Zustand)
// Gestiona estado de autenticación, usuario actual y navegación
// ============================================

import { create } from 'zustand';
import type { User, AppPage, UserRole } from '@/types';
import { setAccessToken, clearAuthTokens } from '@/api/client';
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

  // Acciones
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  navigate: (page: AppPage, itemId?: string | null) => void;
  setNotification: (notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string } | null) => void;
  hydrate: () => Promise<void>;

  // Helpers
  getRoleHome: () => AppPage;
}

/** Obtiene la página home según el rol */
function getHomeForRole(role: UserRole): AppPage {
  switch (role) {
    case 'admin': return 'home';
    case 'doctor': return 'home';
    case 'receptionist': return 'home';
    case 'patient': return 'home';
    case 'pharmacy_manager': return 'home';
    case 'delivery_driver': return 'driver-home';
    default: return 'home';
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado inicial
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  currentPage: 'landing',
  selectedItemId: null,
  notification: null,

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
      currentPage: 'landing',
      selectedItemId: null,
      notification: null,
    });
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
        currentPage: 'landing',
      });
    }
  },

  getRoleHome: () => {
    const { user } = get();
    if (!user) return 'login';
    return getHomeForRole(user.role);
  },
}));
