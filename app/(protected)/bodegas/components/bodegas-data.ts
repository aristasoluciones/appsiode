'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toastSuccess } from '@/lib/toast';
import type {
  IBodega,
  IBodegaDashboard,
  IBodegaCreatePayload,
  IBodegaUpdatePayload,
  IAcuerdo,
  IFotografia,
  TComponenteFoto,
} from '@/types/bodegas';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const BODEGAS_KEYS = {
  lista: (tipoConsejo: string) => ['bodegas', 'lista', tipoConsejo] as const,
  detalle: (id: string | number) => ['bodegas', 'detalle', id] as const,
  dashboard: (tipoConsejo: string) => ['bodegas', 'dashboard', tipoConsejo] as const,
  acuerdo: (idBodega: string | number) => ['bodegas', 'acuerdo', idBodega] as const,
  fotografias: (idBodega: string | number, componente?: TComponenteFoto, etapa?: string) =>
    ['bodegas', 'fotografias', idBodega, componente, etapa] as const,
};

// ─── Hooks de lectura ─────────────────────────────────────────────────────────

export function useBodegasLista(tipoConsejo: string) {
  return useQuery<IBodega[]>({
    queryKey: BODEGAS_KEYS.lista(tipoConsejo),
    queryFn: async () => {
      const { data } = await apiClient.get<IBodega[]>(
        API_ENDPOINTS.BODEGAS.LIST(tipoConsejo),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useBodegaDetalle(id: string | number) {
  return useQuery<IBodega>({
    queryKey: BODEGAS_KEYS.detalle(id),
    queryFn: async () => {
      const { data } = await apiClient.get<IBodega>(
        API_ENDPOINTS.BODEGAS.BY_ID(id),
      );
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useBodegasDashboard(tipoConsejo: string) {
  return useQuery<IBodegaDashboard>({
    queryKey: BODEGAS_KEYS.dashboard(tipoConsejo),
    queryFn: async () => {
      const { data } = await apiClient.get<IBodegaDashboard>(
        API_ENDPOINTS.BODEGAS.DASHBOARD(tipoConsejo),
      );
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAcuerdoBodega(idBodega: string | number) {
  return useQuery<IAcuerdo | null>({
    queryKey: BODEGAS_KEYS.acuerdo(idBodega),
    queryFn: async () => {
      const { data } = await apiClient.get<IAcuerdo | null>(
        API_ENDPOINTS.BODEGAS.ACUERDO(idBodega),
      );
      return data ?? null;
    },
    enabled: !!idBodega,
    staleTime: 60_000,
  });
}

export function useFotografiasBodega(
  idBodega: string | number,
  componente?: TComponenteFoto,
  etapa?: string,
) {
  return useQuery<IFotografia[]>({
    queryKey: BODEGAS_KEYS.fotografias(idBodega, componente, etapa),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (componente) params.set('componente', componente);
      if (etapa) params.set('etapa', etapa);
      const url =
        API_ENDPOINTS.BODEGAS.FOTOGRAFIAS(idBodega) +
        (params.toString() ? `?${params.toString()}` : '');
      const { data } = await apiClient.get<IFotografia[]>(url);
      return data ?? [];
    },
    enabled: !!idBodega,
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCrearBodega() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: IBodegaCreatePayload) => {
      const { data } = await apiClient.post<IBodega>(
        API_ENDPOINTS.BODEGAS.CREATE,
        payload,
      );
      return data;
    },
    onSuccess: (bodega) => {
      toastSuccess('Bodega registrada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'lista'] });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'dashboard'] });
      router.push(`/bodegas/${bodega.id}`);
    },
  });
}

export function useActualizarBodega() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: IBodegaUpdatePayload) => {
      const { data } = await apiClient.put<IBodega>(
        API_ENDPOINTS.BODEGAS.UPDATE,
        payload,
      );
      return data;
    },
    onSuccess: (bodega) => {
      toastSuccess('Bodega actualizada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'lista'] });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(bodega.id) });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'dashboard'] });
      router.push(`/bodegas/${bodega.id}`);
    },
  });
}

export function useSubirAcuerdo(idBodega: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post<IAcuerdo>(
        API_ENDPOINTS.BODEGAS.ACUERDO(idBodega),
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      toastSuccess('Acuerdo cargado correctamente.');
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.acuerdo(idBodega) });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
    },
  });
}

export function useSubirFotografias(idBodega: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      const { data } = await apiClient.post<IFotografia[]>(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIAS(idBodega),
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      toastSuccess('Fotografías cargadas correctamente.');
      queryClient.invalidateQueries({
        queryKey: ['bodegas', 'fotografias', idBodega],
      });
    },
  });
}
