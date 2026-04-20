'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import authClient from '@/lib/api/axios-auth';
import { BFF_ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiResponse, AuthState, AuthUser } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Devuelve true si el usuario tiene acceso al módulo indicado.
   * Los ADMINISTRADORES siempre tienen acceso. */
  hasPermission: (modulo: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await authClient.get<ApiResponse<AuthUser | null>>(
        BFF_ENDPOINTS.AUTH.PERFIL,
      );
      if (res.status === 200 && res.data.data) {
        setState({
          user: res.data.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await authClient.post<ApiResponse<AuthUser | null>>(
          BFF_ENDPOINTS.AUTH.LOGIN,
          { username, password },
        );

        if (res.status === 200 && res.data.status === 200 && res.data.data) {
          
          // Mapear directamente los datos que ya vienen en el login
          setState({
            user: res.data.data,   // ya trae modulos + proceso
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('Login exitoso desde AuthProvider:');
          return { success: true };
        }

        return {
          success: false,
          message: res.data.message || 'Error de autenticación',
        };
      } catch {
        return {
          success: false,
          message: 'Error al conectar con el servicio de autenticación',
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authClient.post(BFF_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      router.push('/signin');
    }
  }, [router]);

  const hasPermission = useCallback(
    (modulo: string): boolean => {
      if (!state.user) return false;
      if (state.user.rol === 'ADMINISTRADOR') return true;
      return state.user.modulos?.includes(modulo) ?? false;
    },
    [state.user],
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
