'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  IIntegranteConsejo,
  IRepresentacionPartido,
} from '@/types/externos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { EXTERNOS_KEYS } from '@/lib/query-keys';

type TTipoConsejo = 'D' | 'M';

/**
 * Consejerías, presidencia y secretaría técnica del consejo (SICE). El API ya
 * filtra por consejo y valida el acceso: el consejo consulta el suyo y oficina
 * central el que indique. Sin tipo o consejo no consulta.
 */
export function useIntegracionConsejo(
  tipoConsejo: TTipoConsejo | null,
  idConsejo: string | number | null,
) {
  return useQuery<IIntegranteConsejo[]>({
    queryKey: EXTERNOS_KEYS.integracion(tipoConsejo, idConsejo),
    queryFn: async () => {
      const { data } = await apiClient.get<IIntegranteConsejo[]>(
        API_ENDPOINTS.EXTERNOS.INTEGRACION(idConsejo!, tipoConsejo!),
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tipoConsejo && idConsejo != null && idConsejo !== '',
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/** Representaciones de partido aprobadas del consejo (RPP), con URL completas. */
export function useRepresentacionesConsejo(
  tipoConsejo: TTipoConsejo | null,
  idConsejo: string | number | null,
) {
  return useQuery<IRepresentacionPartido[]>({
    queryKey: EXTERNOS_KEYS.representaciones(tipoConsejo, idConsejo),
    queryFn: async () => {
      const { data } = await apiClient.get<IRepresentacionPartido[]>(
        API_ENDPOINTS.EXTERNOS.REPRESENTACIONES(idConsejo!, tipoConsejo!),
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tipoConsejo && idConsejo != null && idConsejo !== '',
    staleTime: 60_000,
    retry: 1,
  });
}
