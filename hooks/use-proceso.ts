'use client';

import { useAuth } from '@/providers/auth-provider';
import type { TTipoConsejo } from '@/types/proceso';

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
 * Expone el proceso electoral activo del usuario autenticado.
 *
 * Los datos se resuelven en AuthProvider al hacer login/refreshUser, de forma
 * paralela al fetch del perfil. Nunca hay un segundo request desde el cliente.
 *
 * Mantiene el mismo shape { data, isLoading } que antes para compatibilidad
 * con todos los consumidores existentes sin ningún cambio en ellos.
 */
export function useProceso() {
  const { user, isLoading } = useAuth();
  return {
    data: user?.proceso ?? null,
    isLoading,
  };
}
