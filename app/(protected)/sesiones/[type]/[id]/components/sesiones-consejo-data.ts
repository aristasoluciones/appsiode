'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { SESIONES_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';
import type {
  ISesionConsejoAPI,
  ISesionConsejo,
  IConsejoMeta,
  ISesionesConsejoPayload,
} from '@/types/sesiones';

export type { ISesionConsejo, IConsejoMeta } from '@/types/sesiones';

export interface ISesionesConsejoResult {
  sessions: ISesionConsejo[];
  meta: { consejo: IConsejoMeta } | null;
  /** true cuando el API devolvió 404 (consejo inexistente) */
  notFound: boolean;
}

function mapSesion(item: ISesionConsejoAPI): ISesionConsejo {
  return {
    id: item.id,
    noSesion: item.no_sesion,
    tipo: item.tipo,
    fechaProgramada: item.fecha_programada,
    fechaInicio: item.fecha_inicio,
    fechaTermino: item.fecha_termino,
    status: item.status,
    statusColor: item.status_color,
    statusText: item.status_text,
    incidencias: item.incidencias,
  };
}

/**
 * Sesiones + meta de un consejo específico.
 * @param type     — param de URL: 'd' | 'm'  →  char 'D' | 'M' para el API
 * @param idConsejo — clave numérica del consejo
 * @param enabled   — si es false, la query no se ejecuta (default: true)
 *
 * Retorna `notFound: true` (sin lanzar error) cuando el API responde 404.
 */
export function useSesionesConsejo(type: string, idConsejo: string, enabled = true) {
  const tipoChar = type.toUpperCase();
  return useQuery({
    queryKey: SESIONES_KEYS.consejo(tipoChar, idConsejo),
    enabled,
    queryFn: async (): Promise<ISesionesConsejoResult> => {
      try {
        const { data } = await apiClient.get<ISesionesConsejoPayload>(
          API_ENDPOINTS.SESIONES.CONSEJO_SESIONES(tipoChar, idConsejo),
        );

        // The axios interceptor preserves meta when the .NET envelope includes it,
        // so data here is { data: ISesionConsejoAPI[], meta: { consejo: ... } }.
        // We keep a fallback for array just in case.
        const sessions = Array.isArray(data)
          ? data
          : (data.data ?? []);
        const meta = Array.isArray(data)
          ? null
          : (data.meta ?? null);

        return {
          sessions: sessions.map(mapSesion),
          meta,
          notFound: false,
        };
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return { sessions: [], meta: null, notFound: true };
        }
        throw err;
      }
    },
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Elimina una sesión del consejo y refresca su listado.
 *
 * @param type      — param de URL: 'd' | 'm'
 * @param idConsejo — clave numérica del consejo
 */
export function useEliminarSesion(type: string, idConsejo: string) {
  const queryClient = useQueryClient();
  const tipoChar = type.toUpperCase();

  return useMutation({
    mutationFn: async (idSesion: string | number) => {
      await apiClient.delete(API_ENDPOINTS.SESIONES.SESION_DETALLE(idSesion));
      return idSesion;
    },
    onSuccess: () => {
      toastSuccess('Sesión eliminada correctamente.');
      queryClient.invalidateQueries({ queryKey: SESIONES_KEYS.consejo(tipoChar, idConsejo) });
      queryClient.invalidateQueries({ queryKey: SESIONES_KEYS.indicadoresTodos() });
    },
  });
}
