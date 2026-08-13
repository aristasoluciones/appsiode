'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { PROCESOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';
import type { IProcesoCatalogo, IProcesoPayload } from '@/types/proceso';

export type { IProcesoCatalogo, IProcesoPayload };

// ── Etiquetas de catálogo ─────────────────────────────────────────────────────

export const TIPOS_PROCESO = [
  { id: 'ORDINARIO', nombre: 'Ordinario' },
  { id: 'EXTRAORDINARIO', nombre: 'Extraordinario' },
] as const;

export const MODOS_PROCESO = [
  { id: 'PROD', nombre: 'Producción' },
  { id: 'SIMULACRO', nombre: 'Simulacro' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  ACT: 'Activo',
  PROG: 'Programado',
  FIN: 'Finalizado',
  CAN: 'Cancelado',
};

export const etiquetaTipo = (tipo: string) =>
  TIPOS_PROCESO.find((t) => t.id === tipo)?.nombre ?? tipo;

export const etiquetaModo = (modo: string) =>
  MODOS_PROCESO.find((m) => m.id === modo)?.nombre ?? modo;

export const etiquetaStatus = (status: string) => STATUS_LABEL[status] ?? status;

// ── Queries ───────────────────────────────────────────────────────────────────

/** Catálogo completo de procesos electorales. */
export function useProcesos(enabled = true) {
  return useQuery({
    queryKey: PROCESOS_KEYS.lista(),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<IProcesoCatalogo[]>(
        API_ENDPOINTS.PROCESOS.LIST,
      );
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IProcesoPayload) => {
      const { data } = await apiClient.post(API_ENDPOINTS.PROCESOS.CREATE, {
        ...payload,
        ...getDataAuditoria(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESOS_KEYS.raiz() });
      toastSuccess('Proceso registrado correctamente.');
    },
    // El toast de error lo emite el interceptor con el mensaje del API.
  });
}

export function useUpdateProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      idProceso,
      payload,
    }: {
      idProceso: number;
      payload: IProcesoPayload;
    }) => {
      const { data } = await apiClient.put(API_ENDPOINTS.PROCESOS.UPDATE(idProceso), {
        ...payload,
        ...getDataAuditoria(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESOS_KEYS.raiz() });
      toastSuccess('Proceso actualizado correctamente.');
    },
  });
}
