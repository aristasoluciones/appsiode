'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toastSuccess, toastError } from '@/lib/toast';
import type {
  IBodega,
  IBodegaDashboard,
  IBodegaCreatePayload,
  IBodegaUpdatePayload,
  IAcuerdo,
  IFotografia,
  IFotografiaConfig,
  TComponenteFoto,
  IBodegasListaResult,
} from '@/types/bodegas';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const BODEGAS_KEYS = {
  lista: (tipo: string, tipoConsejo?: string, idConsejo?: number) =>
    ['bodegas', 'lista', tipo, tipoConsejo ?? 'all', idConsejo ?? 0] as const,
  detalle: (id: string | number) => ['bodegas', 'detalle', id] as const,
  dashboard: (tipo: string, tipoConsejo?: string) =>
    ['bodegas', 'dashboard', tipo, tipoConsejo ?? 'all'] as const,
  acuerdo: (idBodega: string | number) => ['bodegas', 'acuerdo', idBodega] as const,
  fotografias: (idBodega: string | number, componente?: TComponenteFoto, etapa?: string) =>
    ['bodegas', 'fotografias', idBodega, componente, etapa] as const,
  fotografiasConfig: () => ['bodegas', 'fotografias-config'] as const,
};

// ─── Hooks de lectura ─────────────────────────────────────────────────────────

export function useBodegasLista(
  tipo: 'OC' | 'C',
  tipoConsejo?: string,
  idConsejo?: number,
  enabled = true,
) {
  return useQuery<IBodegasListaResult>({
    queryKey: BODEGAS_KEYS.lista(tipo, tipoConsejo, idConsejo),
    queryFn: async () => {
      const response = await apiClient.get<
        IBodega[] | { data: IBodega[]; meta: any }
      >(
        API_ENDPOINTS.BODEGAS.LIST(tipo, tipoConsejo, idConsejo),
      );
      const result = response.data;
      
      // Handle envelope with meta: { data: [], meta: {...} }
      if (result && typeof result === 'object' && 'data' in result) {
        const envelope = result as { data: IBodega[]; meta: any };
        return {
          bodegas: envelope.data ?? [],
          meta: envelope.meta ?? null,
        };
      }
      
      // Handle direct array (no meta)
      return {
        bodegas: Array.isArray(result) ? result : [],
        meta: null,
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useBodegaDetalle(id: string | number) {
  return useQuery<IBodega>({
    queryKey: BODEGAS_KEYS.detalle(id),
    queryFn: async () => {
      const response = await apiClient.get<IBodega | { data: IBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.BY_ID(id),
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IBodega; meta: any }).data;
      }
      return result;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useBodegasDashboard(
  tipo: 'OC' | 'C',
  tipoConsejo?: string,
  enabled = true,
) {
  return useQuery<IBodegaDashboard>({
    queryKey: BODEGAS_KEYS.dashboard(tipo, tipoConsejo),
    queryFn: async () => {
      const response = await apiClient.get<IBodegaDashboard | { data: IBodegaDashboard; meta: any }>(
        API_ENDPOINTS.BODEGAS.DASHBOARD(tipo, tipoConsejo),
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      let dashboard: IBodegaDashboard;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        dashboard = (result as { data: IBodegaDashboard; meta: any }).data;
      } else {
        dashboard = result;
      }
      return dashboard ?? {
        progreso: {
          total: 0,
          captura: 0,
          registrada: 0,
          observada: 0,
          validada: 0,
          verificada: 0,
          informada: 0,
        },
        consejos: [],
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useAcuerdoBodega(idBodega: string | number) {
  return useQuery<IAcuerdo | null>({
    queryKey: BODEGAS_KEYS.acuerdo(idBodega),
    queryFn: async () => {
      const response = await apiClient.get<IAcuerdo | null | { data: IAcuerdo | null; meta: any }>(
        API_ENDPOINTS.BODEGAS.ACUERDO(idBodega),
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IAcuerdo | null; meta: any }).data ?? null;
      }
      return result ?? null;
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
      const response = await apiClient.get<IFotografia[] | { data: IFotografia[]; meta: any }>(url);
      const result = response.data;
      // Handle envelope with meta: { data: [], meta: {...} }
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IFotografia[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
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
      const response = await apiClient.post<IBodega | { data: IBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.CREATE,
        payload,
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IBodega; meta: any }).data;
      }
      return result;
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
      const response = await apiClient.put<IBodega | { data: IBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.UPDATE,
        payload,
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IBodega; meta: any }).data;
      }
      return result;
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
      const response = await apiClient.post<IAcuerdo | { data: IAcuerdo; meta: any }>(
        API_ENDPOINTS.BODEGAS.ACUERDO(idBodega),
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IAcuerdo; meta: any }).data;
      }
      return result;
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
    mutationFn: async (payload: { files: File[]; id_config?: number }) => {
      const form = new FormData();
      payload.files.forEach((f) => form.append('files', f));
      if (payload.id_config != null) form.append('id_config', String(payload.id_config));
      const response = await apiClient.post<IFotografia[] | { data: IFotografia[]; meta: any }>(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIAS(idBodega),
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const result = response.data;
      // Handle envelope with meta: { data: [], meta: {...} }
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IFotografia[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
    },
    onSuccess: () => {
      toastSuccess('Fotografías cargadas correctamente.');
      queryClient.invalidateQueries({
        queryKey: ['bodegas', 'fotografias', idBodega],
      });
    },
  });
}

// ─── Hooks de fotografías con config ──────────────────────────────────────────

export function useFotografiasConfig() {
  return useQuery<IFotografiaConfig[]>({
    queryKey: BODEGAS_KEYS.fotografiasConfig(),
    queryFn: async () => {
      const response = await apiClient.get<IFotografiaConfig[] | { data: IFotografiaConfig[]; meta: any }>(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIAS_CONFIG,
      );
      const result = response.data;
      // Handle envelope with meta: { data: [], meta: {...} }
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IFotografiaConfig[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useFotografiasConConfig(
  idBodega: string | number,
  categoria?: IFotografiaConfig['categoria'],
  momento?: IFotografiaConfig['momento'],
) {
  return useQuery<IFotografia[]>({
    queryKey: ['bodegas', 'fotografias', idBodega, categoria, momento],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoria) params.set('categoria', categoria);
      if (momento) params.set('momento', momento);
      const url =
        API_ENDPOINTS.BODEGAS.FOTOGRAFIAS(idBodega) +
        (params.toString() ? `?${params.toString()}` : '');
      const response = await apiClient.get<IFotografia[] | { data: IFotografia[]; meta: any }>(url);
      const result = response.data;
      // Handle envelope with meta: { data: [], meta: {...} }
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IFotografia[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
    },
    enabled: !!idBodega,
    staleTime: 30_000,
  });
}

export function useObservarFotografia(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, observacion }: { id: string | number; observacion: string }) => {
      const response = await apiClient.post<IFotografia | { data: IFotografia; meta: any }>(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIA_OBSERVAR(id),
        { observacion },
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IFotografia; meta: any }).data;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bodegas', 'fotografias', idBodega],
      });
    },
  });
}

export function useValidarFotografia(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string | number }) => {
      const response = await apiClient.post<IFotografia | { data: IFotografia; meta: any }>(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIA_VALIDAR(id),
      );
      const result = response.data;
      // Handle envelope with meta: { data: {...}, meta: {...} }
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IFotografia; meta: any }).data;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bodegas', 'fotografias', idBodega],
      });
    },
  });
}

export function useEliminarFotografia(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idFotografia: string | number) => {
      await apiClient.delete(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIA_DELETE(idBodega, idFotografia),
      );
    },
    onSuccess: () => {
      toastSuccess('Fotografía eliminada correctamente.');
      queryClient.invalidateQueries({
        queryKey: ['bodegas', 'fotografias', idBodega],
      });
    },
    onError: () => {
      toastError('No se pudo eliminar la fotografía.');
    },
  });
}
