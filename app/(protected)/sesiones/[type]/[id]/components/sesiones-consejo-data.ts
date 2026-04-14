'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
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
 *
 * Retorna `notFound: true` (sin lanzar error) cuando el API responde 404.
 */
export function useSesionesConsejo(type: string, idConsejo: string) {
  const tipoChar = type.toUpperCase();
  return useQuery({
    queryKey: ['sesiones', 'consejo', tipoChar, idConsejo],
    queryFn: async (): Promise<ISesionesConsejoResult> => {
      try {
        const { data } = await apiClient.get<ISesionesConsejoPayload>(
          API_ENDPOINTS.SESIONES.CONSEJO_SESIONES(tipoChar, idConsejo),
        );
        return {
          sessions: data.data.map(mapSesion),
          meta: data.meta,
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
