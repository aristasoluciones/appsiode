'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import authClient from '@/lib/api/axios-auth';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ApiResponse, AuthState, AuthUser } from '@/types/auth';
import type { IProceso } from '@/types/proceso';

interface AuthContextType extends AuthState {
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Devuelve true si el usuario tiene acceso al módulo indicado.
   * Acepta una clave o un array de claves (OR). Los ADMINISTRADORES siempre tienen acceso. */
  hasPermission: (modulo: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * El claim "modulos" puede llegar como:
 *  - Array:   ["SESIONES","USUARIOS"]
 *  - String:  "SESIONES,USUARIOS"
 *  - Ausente: undefined / null
 */
function parseModulos(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map((m) => m.trim()).filter(Boolean);
  return [];
}

/**
 * Mapea la respuesta snake_case de /Auth/perfil al shape AuthUser (camelCase).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToAuthUser(d: Record<string, any>): AuthUser {
  return {
    id:              String(d.id            ?? ''),
    nombre:          d.nombre              ?? '',
    email:           d.email ?? d.usuario  ?? '',
    rol:             d.rol   ?? d.role     ?? '',
    idRol:           String(d.id_rol       ?? ''),
    idProceso:       String(d.id_proceso   ?? ''),
    idConsejo:       String(d.id_consejo   ?? ''),
    tipoConsejo:     d.tipo_consejo        ?? '',
    tipoConsejoDesc: d.tipo_consejo_desc   ?? '',
    claveConsejo:    d.clave_consejo       ?? '',
    consejo:         d.consejo             ?? '',
    modulos:         parseModulos(d.modulos),
  };
}

/**
 * El perfil NO se consulta con TanStack Query a propósito: este provider envuelve
 * al QueryProvider y es el arranque de la sesión (login/logout escriben el estado
 * directamente y de ahí depende el ruteo). El resto de las lecturas del sistema sí
 * pasan por useQuery.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await authClient.get<ApiResponse<Record<string, unknown> | null>>(
        API_ENDPOINTS.AUTH.PERFIL,
      );
      if (res.status === 200 && res.data.data) {
        const user = mapToAuthUser(res.data.data);

        // Resolver el proceso activo junto con el perfil, como hacía el BFF
        let proceso: IProceso | null = null;
        if (user.idProceso) {
          try {
            const procesoRes = await authClient.get<ApiResponse<IProceso | null>>(
              API_ENDPOINTS.CATALOGOS.PROCESO(user.idProceso),
            );
            if (procesoRes.status === 200 && procesoRes.data.data) {
              proceso = procesoRes.data.data;
            }
          } catch {
            // proceso queda null — no bloquea la sesión
          }
        }

        setState({
          user: { ...user, proceso },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Usar actualización funcional: si login() ya autenticó al usuario,
        // no sobreescribir con false (evita race condition en producción).
        setState((prev) =>
          prev.isAuthenticated
            ? { ...prev, isLoading: false }
            : { user: null, isAuthenticated: false, isLoading: false },
        );
      }
    } catch {
      setState((prev) =>
        prev.isAuthenticated
          ? { ...prev, isLoading: false }
          : { user: null, isAuthenticated: false, isLoading: false },
      );
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await authClient.post<ApiResponse<AuthUser | null>>(
          API_ENDPOINTS.AUTH.LOGIN,
          { username, password },
        );

        if (res.status === 200 && res.data.status === 200 && res.data.data) {

          // Mapear directamente los datos que ya vienen en el login
          setState({
            user: res.data.data,   // ya trae modulos + proceso
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        }

        return {
          success: false,
          message: res.data.message || 'Error de autenticación',
        };
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message
          : undefined;
        return {
          success: false,
          message: message || 'Error al conectar con el servicio de autenticación',
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      router.push('/signin');
    }
  }, [router]);

  const hasPermission = useCallback(
    (modulo: string | string[]): boolean => {
      if (!state.user) return false;
      //Todos los roles se evaluan por módulo, no por rol. Si se quisiera evaluar por rol, se haría aquí.
      //if (state.user.rol === 'ADMINISTRADOR') return true;
      const claves = Array.isArray(modulo) ? modulo : [modulo];
      return claves.some((c) => state.user!.modulos?.includes(c) ?? false);
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
