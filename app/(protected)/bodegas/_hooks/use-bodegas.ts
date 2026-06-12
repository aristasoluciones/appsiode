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
  IBodegaDetalleResult,
  IObservacionBodega,
  ICrearObservacionPayload,
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
  observaciones: (idBodega: string | number, status?: string) =>
    ['bodegas', 'observaciones', idBodega, status ?? 'all'] as const,
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
      
      if (result && typeof result === 'object' && 'data' in result) {
        const envelope = result as { data: IBodega[]; meta: any };
        return {
          bodegas: envelope.data ?? [],
          meta: envelope.meta ?? null,
        };
      }
      
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
  return useQuery<IBodegaDetalleResult>({
    queryKey: BODEGAS_KEYS.detalle(id),
    queryFn: async () => {
      const response = await apiClient.get<IBodega | { data: IBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.BY_ID(id),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        const envelope = result as { data: IBodega; meta: any };
        return {
          bodega: envelope.data,
          meta: envelope.meta ?? null,
        };
      }
      return {
        bodega: result as IBodega,
        meta: null,
      };
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

export function useAcuerdoBodega(idBodega: string | number, enabled = true) {
  return useQuery<IAcuerdo | null>({
    queryKey: BODEGAS_KEYS.acuerdo(idBodega),
    queryFn: async () => {
      const response = await apiClient.get<
        IAcuerdo | IAcuerdo[] | null | { data: IAcuerdo[]; meta: any }
      >(
        API_ENDPOINTS.BODEGAS.ACUERDO(idBodega),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        const envelope = result as { data: IAcuerdo[]; meta: any };
        return envelope.data?.[0] ?? null;
      }
      if (Array.isArray(result)) {
        return result[0] ?? null;
      }
      return result ?? null;
    },
    enabled: !!idBodega && enabled,
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
        API_ENDPOINTS.BODEGAS.UPDATE(payload.id),
        payload,
      );
      const result = response.data;
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

export function useEliminarAcuerdo(idBodega: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idAcuerdo: number) => {
      await apiClient.delete(API_ENDPOINTS.BODEGAS.ACUERDO_DELETE(idBodega, idAcuerdo));
    },
    onSuccess: () => {
      toastSuccess('Acuerdo eliminado correctamente.');
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.acuerdo(idBodega) });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
    },
    onError: () => {
      toastError('No se pudo eliminar el acuerdo.');
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

export function useFotografiasConfig(enabled = true) {
  return useQuery<IFotografiaConfig[]>({
    queryKey: BODEGAS_KEYS.fotografiasConfig(),
    queryFn: async () => {
      const response = await apiClient.get<IFotografiaConfig[] | { data: IFotografiaConfig[]; meta: any }>(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIAS_CONFIG,
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IFotografiaConfig[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
    },
    enabled,
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
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IFotografia[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
    },
    enabled: !!idBodega,
    staleTime: 30_000,
  });
}

export function useToggleStatusFotografia(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string | number }) => {
      const response = await apiClient.put<IFotografia | { data: IFotografia; meta: any }>(
        API_ENDPOINTS.BODEGAS.FOTOGRAFIA_TOGGLE_STATUS(idBodega, id),
      );
      const result = response.data;
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

// ─── Hooks de observaciones a nivel bodega ────────────────────────────────────

export function useObservacionesBodega(idBodega: string | number, enabled = true) {
  return useQuery<IObservacionBodega[]>({
    queryKey: BODEGAS_KEYS.observaciones(idBodega, 'all'),
    queryFn: async () => {
      const response = await apiClient.get<IObservacionBodega[] | { data: IObservacionBodega[]; meta: any }>(
        API_ENDPOINTS.BODEGAS.OBSERVACIONES(idBodega),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IObservacionBodega[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
    },
    enabled: !!idBodega && enabled,
    staleTime: 10_000,
  });
}

export function useObservacionesPendientes(idBodega: string | number) {
  return useQuery<IObservacionBodega[]>({
    queryKey: BODEGAS_KEYS.observaciones(idBodega, 'Pendiente'),
    queryFn: async () => {
      const response = await apiClient.get<IObservacionBodega[] | { data: IObservacionBodega[]; meta: any }>(
        API_ENDPOINTS.BODEGAS.OBSERVACIONES(idBodega, { status: 'Pendiente' }),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IObservacionBodega[]; meta: any }).data ?? [];
      }
      return Array.isArray(result) ? result : [];
    },
    enabled: !!idBodega,
    staleTime: 10_000,
  });
}

export function useCrearObservacionBodega(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ICrearObservacionPayload) => {
      const response = await apiClient.post<IObservacionBodega | { data: IObservacionBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.CREAR_OBSERVACION(idBodega),
        payload,
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IObservacionBodega; meta: any }).data;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'all') });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'Pendiente') });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'fotografias', idBodega] });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
      toastSuccess('Observación registrada correctamente.');
    },
    onError: () => {
      toastError('No se pudo registrar la observación.');
    },
  });
}

export function useValidarBodega() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idBodega: string | number) => {
      const response = await apiClient.put<IBodega | { data: IBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.VALIDAR(idBodega),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IBodega; meta: any }).data;
      }
      return result;
    },
    onSuccess: (_, idBodega) => {
      toastSuccess('Bodega validada correctamente.');
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'lista'] });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'dashboard'] });
    },
    onError: () => {
      toastError('No se pudo validar la bodega.');
    },
  });
}

export function useEnviarObservacionesBodega() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idBodega: string | number) => {
      const response = await apiClient.post<IBodega | { data: IBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.ENVIAR_OBSERVACIONES(idBodega),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IBodega; meta: any }).data;
      }
      return result;
    },
    onSuccess: (_, idBodega) => {
      toastSuccess('Observaciones enviadas correctamente.');
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'all') });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'Pendiente') });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'lista'] });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'dashboard'] });
    },
    onError: () => {
      toastError('No se pudieron enviar las observaciones.');
    },
  });
}

export function useEliminarObservacionBodega(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idObservacion: number) => {
      await apiClient.delete(
        API_ENDPOINTS.BODEGAS.OBSERVACION_DELETE(idBodega, idObservacion),
      );
    },
    onSuccess: () => {
      toastSuccess('Observación eliminada correctamente.');
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'all') });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'Pendiente') });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'fotografias', idBodega] });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
    },
    onError: () => {
      toastError('No se pudo eliminar la observación.');
    },
  });
}

export function useToggleStatusObservacionBodega(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idObservacion: number) => {
      const response = await apiClient.put<IObservacionBodega | { data: IObservacionBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.OBSERVACION_TOGGLE_STATUS(idBodega, idObservacion),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IObservacionBodega; meta: any }).data;
      }
      return result;
    },
    onSuccess: () => {
      toastSuccess('Estatus de observación actualizado correctamente.');
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'all') });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.observaciones(idBodega, 'Pendiente') });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
    },
    onError: () => {
      toastError('No se pudo actualizar el estatus de la observación.');
    },
  });
}

export function useSolicitarValidacionBodega() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idBodega: string | number) => {
      const response = await apiClient.put<IBodega | { data: IBodega; meta: any }>(
        API_ENDPOINTS.BODEGAS.SOLICITAR_VALIDACION(idBodega),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        return (result as { data: IBodega; meta: any }).data;
      }
      return result;
    },
    onSuccess: (_, idBodega) => {
      toastSuccess('Solicitud de validación enviada correctamente.');
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'lista'] });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'dashboard'] });
    },
    onError: () => {
      toastError('No se pudo enviar la solicitud de validación.');
    },
  });
}

export function useEliminarBodega() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(API_ENDPOINTS.BODEGAS.DELETE(id));
    },
    onSuccess: () => {
      toastSuccess('Bodega eliminada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'lista'] });
      queryClient.invalidateQueries({ queryKey: ['bodegas', 'dashboard'] });
      router.push('/bodegas');
    },
    onError: () => {
      toastError('No se pudo eliminar la bodega.');
    },
  });
}
