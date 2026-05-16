// ============================================
// OASIS - API Client (Axios)
// - Access token stored IN MEMORY (not localStorage)
// - Refresh token stored in httpOnly Cookie (managed by Browser/Backend)
// - Axios interceptor: inject Bearer token on every request
// - Axios interceptor: on 401, attempt token refresh via POST /auth/refresh
// - NO mock fallbacks — all errors are real
// ============================================

import axios, { 
  type AxiosError, 
  type AxiosRequestConfig, 
  type AxiosResponse, 
  type InternalAxiosRequestConfig 
} from 'axios';

// Config values (fallback to defaults if constants are missing)
// Use the server IP directly to avoid proxy issues in static/mobile mode
const API_BASE_URL = 'http://192.168.0.100:8000';
const API_PREFIX = '/api/v1';

/**
 * Get the base API URL including prefix
 */
export function getApiUrl(): string {
  return `${API_BASE_URL}${API_PREFIX}`;
}

// --- In-memory access token ---
let accessToken: string | null = null;

// --- Refresh lock to prevent concurrent refresh requests ---
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// --- API Response Types ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

// --- Axios Instance ---
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Required for httpOnly refresh cookies
  timeout: 30000,
});

// --- Request Interceptor: Inject Bearer token ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// --- Response Interceptor: Handle 401 with token refresh ---
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh auth endpoints themselves
      const isAuthEndpoint =
        typeof originalRequest.url === 'string' &&
        (originalRequest.url.includes('/auth/login') ||
          originalRequest.url.includes('/auth/refresh'));

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            originalRequest._retry = true;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // We don't send the refresh_token in the body anymore, it's in the cookie
        const response = await axios.post<ApiResponse<{ access_token: string }>>(
          `${API_BASE_URL}${API_PREFIX}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data.data;
        setAccessToken(access_token);
        onRefreshed(access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshSubscribers = [];
        accessToken = null;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
          window.location.href = '/entrar';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- Token Management ---

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAuthTokens(): void {
  accessToken = null;
}

// --- API Helper Functions ---

export async function get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(endpoint, { params });
  return response.data;
}

export async function post<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(endpoint, body);
  return response.data;
}

export async function put<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(endpoint, body);
  return response.data;
}

export async function patch<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(endpoint, body);
  return response.data;
}

export async function del<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(endpoint);
  return response.data;
}

// --- Error Helper ---

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    if (apiError?.error?.message) return apiError.error.message;
    if (error.message === 'Network Error') return 'Error de conexión. Verifica tu conexión a internet.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Error desconocido';
}

export default apiClient;
