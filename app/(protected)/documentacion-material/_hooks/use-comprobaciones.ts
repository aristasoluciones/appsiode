'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { MATERIAL_ELECTORAL_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';
import type {
  IComprobacionCapturaPayload,
  IComprobacionHistorial,
  IComprobacionesData,
} from '@/types/material-electoral';

/** Lista vacía para que la pantalla siempre reciba la misma forma de datos. */
const SIN_DATOS: IComprobacionesData = {
  id_consejo: 0,
  tipo_consejo: 'D',
  elecciones: [],
  resumen: {
    total: 0,
    capturados: 0,
    sin_informacion: 0,
    sin_inconsistencias: 0,
    con_faltantes: 0,
    con_excedentes: 0,
    porcentaje: 0,
    completo: false,
  },
  documentos: [],
};

/**
 * Documentación y material del consejo con su comprobación. Se piden todas las
 * elecciones de una vez: el filtro por elección y por estatus se resuelve en
 * pantalla, sin volver al servidor.
 */
export function useComprobaciones(
  tipoConsejo: 'D' | 'M' | null,
  idConsejo: number | null,
) {
  return useQuery<IComprobacionesData>({
    queryKey: MATERIAL_ELECTORAL_KEYS.comprobacionesConsejo(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
      'TODAS',
    ),
    enabled: !!tipoConsejo && !!idConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IComprobacionesData>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.COMPROBACIONES(
          idConsejo!,
          tipoConsejo!,
        ),
      );
      return {
        ...SIN_DATOS,
        ...data,
        elecciones: data?.elecciones ?? [],
        documentos: data?.documentos ?? [],
        resumen: data?.resumen ?? SIN_DATOS.resumen,
      };
    },
    staleTime: 30_000,
  });
}

/** Historial de un renglón; solo se pide con la ventana abierta. */
export function useComprobacionHistorial(
  id: number | null,
  tipoConsejo: 'D' | 'M' | null,
  idConsejo: number | null,
) {
  return useQuery<IComprobacionHistorial>({
    queryKey: MATERIAL_ELECTORAL_KEYS.comprobacionHistorial(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
      id ?? 0,
    ),
    enabled: !!id && !!tipoConsejo && !!idConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IComprobacionHistorial>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.COMPROBACION_HISTORIAL(
          id!,
          idConsejo!,
          tipoConsejo!,
        ),
      );
      return { ...data, eventos: data?.eventos ?? [] };
    },
  });
}

/**
 * Captura la cantidad física de un renglón. La diferencia, el estatus y la
 * obligatoriedad de las observaciones las resuelve el servidor; al guardar se
 * refrescan la lista y el historial del renglón.
 */
export function useCapturarComprobacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IComprobacionCapturaPayload) => {
      const { data } = await apiClient.post(
        API_ENDPOINTS.MATERIAL_ELECTORAL.COMPROBACION_CAPTURA,
        payload,
      );
      return data;
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_ELECTORAL_KEYS.comprobaciones(),
      });
      queryClient.invalidateQueries({
        queryKey: MATERIAL_ELECTORAL_KEYS.comprobacionHistorial(
          payload.tipo_consejo,
          payload.id_consejo,
          payload.id,
        ),
      });
      toastSuccess('Comprobación física guardada con éxito.');
    },
  });
}
