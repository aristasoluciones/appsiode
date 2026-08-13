'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { APERTURAS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';
import type {
  IAperturaBodega,
  IAperturaBodegaDetalleAPI,
  IAperturaBodegaDetallePayload,
  IAperturaBodegaListaPayload,
  IAperturaCrearPayload,
  IAperturaActualizarPayload,
  IAperturaCerrarPayload,
  IAperturaHistorialItem,
  IAperturaHistorialPayload,
  IAperturasListaMeta,
  IAperturasResumenData,
  TTipoEleccion,
} from '@/types/aperturas-bodegas';

// ─── Lista ────────────────────────────────────────────────────────────────────

export interface IAperturasListaResult {
  aperturas: IAperturaBodega[];
  /** Datos del consejo consultado; null cuando el API no los envía. */
  meta: IAperturasListaMeta | null;
}

export function useAperturasLista(
  tipoConsejo: 'D' | 'M' | null,
  idConsejo: string | number | null,
  tipoEleccion: TTipoEleccion | null,
  enabled = true,
) {
  return useQuery<IAperturasListaResult>({
    queryKey: APERTURAS_KEYS.lista(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
      tipoEleccion ?? 'NONE',
    ),
    enabled: enabled && !!tipoConsejo && idConsejo != null && !!tipoEleccion,
    queryFn: async () => {
      const { data } = await apiClient.get<
        IAperturaBodega[] | IAperturaBodegaListaPayload
      >(API_ENDPOINTS.APERTURAS_BODEGAS.LIST(tipoConsejo!, String(idConsejo), tipoEleccion!));
      if (Array.isArray(data)) {
        return { aperturas: data, meta: null };
      }
      return {
        aperturas: data.data ?? [],
        meta: data.meta ?? null,
      };
    },
    staleTime: 30_000,
  });
}

// ─── Resumen por consejo (vista administrador) ───────────────────────────────

export function useAperturasResumen(tipoConsejo: 'D' | 'M' | null) {
  return useQuery<IAperturasResumenData>({
    queryKey: APERTURAS_KEYS.resumen(tipoConsejo ?? 'NONE'),
    enabled: !!tipoConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IAperturasResumenData>(
        API_ENDPOINTS.APERTURAS_BODEGAS.RESUMEN(tipoConsejo!),
      );
      return {
        progreso: data.progreso ?? { total: 0, abiertas: 0, cerradas: 0 },
        consejos: data.consejos ?? [],
      };
    },
    staleTime: 30_000,
  });
}

// ─── Detalle ──────────────────────────────────────────────────────────────────

export interface IAperturaDetalleResult {
  cabecera: IAperturaBodega;
  detalle: IAperturaBodegaDetalleAPI;
  /** Datos del consejo; null en aperturas de Oficina Central. */
  meta: IAperturasListaMeta | null;
}

export function useAperturaDetalle(id: string | number) {
  return useQuery<IAperturaDetalleResult | null>({
    queryKey: APERTURAS_KEYS.detalle(id),
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<
          IAperturaBodegaDetalleAPI | IAperturaBodegaDetallePayload
        >(API_ENDPOINTS.APERTURAS_BODEGAS.DETALLE(id));
        // Cuando el API adjunta los datos del consejo, la apertura viaja
        // dentro de `data`; sin ellos llega plana. En ambos casos la cabecera
        // y los *_lista comparten nivel (`IAperturaBodegaDetalleAPI extends
        // IAperturaBodega`).
        const detalle = 'data' in data ? data.data : data;
        const meta = 'meta' in data ? (data.meta ?? null) : null;
        return {
          cabecera: detalle,
          detalle,
          meta,
        };
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── Historial ────────────────────────────────────────────────────────────────

export function useAperturaHistorial(id: string | number) {
  return useQuery<IAperturaHistorialItem[]>({
    queryKey: APERTURAS_KEYS.historial(id),
    queryFn: async () => {
      const { data } = await apiClient.get<IAperturaHistorialItem[] | IAperturaHistorialPayload>(
        API_ENDPOINTS.APERTURAS_BODEGAS.HISTORIAL(id),
      );
      if (Array.isArray(data)) return data;
      return data.data ?? [];
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export function useCrearApertura() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: IAperturaCrearPayload) => {
      const { data } = await apiClient.post<IAperturaBodega>(
        API_ENDPOINTS.APERTURAS_BODEGAS.CREATE,
        payload,
      );
      return data;
    },
    onSuccess: (apertura) => {
      toastSuccess('Apertura registrada correctamente.');
      queryClient.invalidateQueries({ queryKey: APERTURAS_KEYS.listas() });
      router.push(`/aperturas/${apertura.id}`);
    },
  });
}

export function useActualizarApertura() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: IAperturaActualizarPayload) => {
      const { data } = await apiClient.put<IAperturaBodega>(
        API_ENDPOINTS.APERTURAS_BODEGAS.UPDATE(payload.id),
        payload,
      );
      return data;
    },
    onSuccess: (apertura) => {
      toastSuccess('Apertura actualizada correctamente.');
      queryClient.invalidateQueries({ queryKey: APERTURAS_KEYS.detalle(apertura.id) });
      queryClient.invalidateQueries({ queryKey: APERTURAS_KEYS.listas() });
      router.push(`/aperturas/${apertura.id}`);
    },
  });
}

export function useCerrarApertura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: IAperturaCerrarPayload;
    }) => {
      const { data } = await apiClient.put<IAperturaBodega>(
        API_ENDPOINTS.APERTURAS_BODEGAS.CERRAR(id),
        payload,
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      toastSuccess('Apertura cerrada correctamente.');
      queryClient.invalidateQueries({ queryKey: APERTURAS_KEYS.detalle(id) });
      queryClient.invalidateQueries({ queryKey: APERTURAS_KEYS.listas() });
    },
  });
}

export function useEliminarApertura() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(API_ENDPOINTS.APERTURAS_BODEGAS.DELETE(id));
    },
    onSuccess: () => {
      toastSuccess('Apertura eliminada correctamente.');
      queryClient.invalidateQueries({ queryKey: APERTURAS_KEYS.listas() });
      router.push('/aperturas');
    },
  });
}
