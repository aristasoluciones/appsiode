'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAuth } from '@/providers/auth-provider';
import type { IProceso, TTipoConsejo } from '@/types/proceso';

export type { TTipoConsejo, IProceso, IEleccion } from '@/types/proceso';

/** Mapeo canónico: clave de API → clave interna */
export const CONSEJO_TIPO_MAP: Record<'D' | 'M', TTipoConsejo> = {
  D: 'distrital',
  M: 'municipal',
};

/** Mapeo inverso: clave interna → carácter que espera el API */
export const TIPO_CONSEJO_CHAR: Record<TTipoConsejo, 'D' | 'M'> = {
  distrital: 'D',
  municipal: 'M',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Query global del proceso electoral activo para el usuario autenticado.
 *
 * - Lee `idProceso` de `AuthUser` (ya disponible en el auth context).
 * - Se auto-habilita cuando `user.idProceso` está disponible.
 * - Se fetcha una sola vez por sesión (staleTime + gcTime = Infinity).
 * - El layout protegido lo llama primero → todos los hijos reciben datos del caché.
 * - Al hacer logout el layout limpia el caché con `queryClient.removeQueries`.
 */
export function useProceso() {
  const { user } = useAuth();
  const idProceso = user?.idProceso;

  return useQuery<IProceso>({
    queryKey: ['proceso', idProceso],
    queryFn: async () => {
      const { data } = await apiClient.get<IProceso>(
        API_ENDPOINTS.CATALOGOS.PROCESO(idProceso!),
      );
      return data;
    },
    enabled: !!idProceso,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
