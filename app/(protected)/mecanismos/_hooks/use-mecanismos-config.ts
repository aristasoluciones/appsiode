'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IMecanismoConfiguracion,
  IMecanismoConfiguracionPayload,
  TTipoConsejoChar,
} from '@/types/mecanismos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';

/** Banderas de captura de todos los consejos activos del tipo; exclusivo de oficina central. */
export function useConfiguracionConsejos(
  tipoConsejo: TTipoConsejoChar | null,
  habilitado = true,
) {
  return useQuery<IMecanismoConfiguracion[]>({
    queryKey: MECANISMOS_KEYS.configuracionTipo(tipoConsejo ?? 'NONE'),
    enabled: habilitado && !!tipoConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IMecanismoConfiguracion[]>(
        API_ENDPOINTS.MECANISMOS.CONFIGURACION(tipoConsejo!),
      );
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

/**
 * Guarda las banderas de un consejo (captura costo, asigna CAE); nulas vuelven
 * al valor por omisión del tipo. Cambian qué campos ve el consejo al informar,
 * así que se rehacen también sus listas.
 */
export function useGuardarConfiguracionConsejo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tipoConsejo,
      idConsejo,
      payload,
    }: {
      tipoConsejo: TTipoConsejoChar;
      idConsejo: number;
      payload: IMecanismoConfiguracionPayload;
    }) => {
      const { data } = await apiClient.put<IMecanismoConfiguracion>(
        API_ENDPOINTS.MECANISMOS.CONFIGURACION_CONSEJO(tipoConsejo, idConsejo),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MECANISMOS_KEYS.configuracion(),
      });
      queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.mecanismos() });
      queryClient.invalidateQueries({
        queryKey: MECANISMOS_KEYS.seguimiento(),
      });
      toastSuccess('Configuración guardada.');
    },
  });
}
