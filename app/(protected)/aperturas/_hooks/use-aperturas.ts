'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toastSuccess } from '@/lib/toast';
import type {
  IAperturaBodega,
  IAperturaBodegaDetalleAPI,
  IAperturaBodegaListaPayload,
  IAperturaCrearPayload,
  IAperturaActualizarPayload,
  IAperturaCerrarPayload,
  IAperturaHistorialItem,
  IAperturaHistorialPayload,
  TTipoEleccion,
} from '@/types/aperturas-bodegas';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const APERTURAS_KEYS = {
  lista: (tipoConsejo: string, idConsejo: string | number, tipoEleccion: string) =>
    ['aperturas-bodegas', 'lista', tipoConsejo, idConsejo, tipoEleccion] as const,
  detalle: (id: string | number) => ['aperturas-bodegas', 'detalle', id] as const,
  historial: (id: string | number) => ['aperturas-bodegas', 'historial', id] as const,
};

// ─── Lista ────────────────────────────────────────────────────────────────────

export interface IAperturasListaResult {
  aperturas: IAperturaBodega[];
  meta: Record<string, unknown> | null;
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

// ─── Detalle ──────────────────────────────────────────────────────────────────

export interface IAperturaDetalleResult {
  cabecera: IAperturaBodega;
  detalle: IAperturaBodegaDetalleAPI;
}

export function useAperturaDetalle(id: string | number) {
  return useQuery<IAperturaDetalleResult | null>({
    queryKey: APERTURAS_KEYS.detalle(id),
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<IAperturaBodegaDetalleAPI>(
          API_ENDPOINTS.APERTURAS_BODEGAS.DETALLE(id),
        );
        // El backend responde plano: la cabecera y los *_lista comparten el
        // mismo nivel. `IAperturaBodegaDetalleAPI extends IAperturaBodega`,
        // así que `data` ya tiene todos los campos de cabecera.
        return {
          cabecera: data,
          detalle: data,
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
      queryClient.invalidateQueries({ queryKey: ['aperturas-bodegas', 'lista'] });
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
      queryClient.invalidateQueries({ queryKey: ['aperturas-bodegas', 'lista'] });
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
      queryClient.invalidateQueries({ queryKey: ['aperturas-bodegas', 'lista'] });
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
      queryClient.invalidateQueries({ queryKey: ['aperturas-bodegas', 'lista'] });
      router.push('/aperturas');
    },
  });
}
