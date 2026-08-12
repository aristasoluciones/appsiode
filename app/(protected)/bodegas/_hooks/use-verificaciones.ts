'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { BODEGAS_KEYS, VERIFICACIONES_KEYS } from '@/lib/query-keys';
import { toastSuccess, toastError } from '@/lib/toast';
import type {
  IVerificacion,
  IVerificacionResumen,
  ICreateVerificacionInput,
  IUpdateVerificacionInput,
  IFinalizarVerificacionInput,
  IRevisarVerificacionInput,
} from '@/types/verificaciones';

// ─── Helpers de conversión snake_case ↔ camelCase ─────────────────────────────

function toCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result;
}

function toSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

// ─── Hooks de lectura ─────────────────────────────────────────────────────────

export function useVerificaciones(idBodega: string | number, enabled = true) {
  return useQuery<IVerificacionResumen[]>({
    queryKey: VERIFICACIONES_KEYS.lista(idBodega),
    queryFn: async () => {
      const response = await apiClient.get<IVerificacionResumen[] | { data: IVerificacionResumen[]; meta?: any }>(
        API_ENDPOINTS.BODEGAS.VERIFICACIONES_LIST(idBodega),
      );
      const result = response.data;
      let data: IVerificacionResumen[];
      if (result && typeof result === 'object' && 'data' in result) {
        data = (result as { data: IVerificacionResumen[] }).data ?? [];
      } else {
        data = Array.isArray(result) ? result : [];
      }
      return toCamelCase(data) as IVerificacionResumen[];
    },
    enabled: !!idBodega && enabled,
    staleTime: 30_000,
  });
}

export function useVerificacionDetalle(idBodega: string | number, idVerificacion: string | number, enabled = true) {
  return useQuery<{ data: IVerificacion; meta: any }>({
    queryKey: VERIFICACIONES_KEYS.detalle(idBodega, idVerificacion),
    queryFn: async () => {
      const response = await apiClient.get<IVerificacion | { data: IVerificacion; meta?: any }>(
        API_ENDPOINTS.BODEGAS.VERIFICACION_DETAIL(idBodega, idVerificacion),
      );
      const result = response.data;
      let data: IVerificacion;
      let meta: any = null;
      if (result && typeof result === 'object' && 'data' in result) {
        data = (result as { data: IVerificacion; meta?: any }).data;
        meta = (result as { data: IVerificacion; meta?: any }).meta ?? null;
      } else {
        data = result as IVerificacion;
      }
      return { data: toCamelCase(data) as IVerificacion, meta: toCamelCase(meta) };
    },
    enabled: !!idBodega && !!idVerificacion && enabled,
    staleTime: 30_000,
  });
}

export function useUltimaVerificacion(idBodega: string | number, enabled = true) {
  return useQuery<{ data: IVerificacion | null; meta: any }>({
    // Query key independiente (no es subconjunto de la lista) para que
    // no se invalide al crear/actualizar una verificación.
    queryKey: VERIFICACIONES_KEYS.ultima(idBodega),
    queryFn: async () => {
      const response = await apiClient.get<IVerificacion | { data: IVerificacion; meta?: any } | null>(
        API_ENDPOINTS.BODEGAS.VERIFICACION_ULTIMA(idBodega),
      );
      const result = response.data;
      if (result == null) return { data: null, meta: null };
      let data: IVerificacion | null;
      let meta: any = null;
      if (typeof result === 'object' && 'data' in result) {
        data = (result as { data: IVerificacion; meta?: any }).data ?? null;
        meta = (result as { data: IVerificacion; meta?: any }).meta ?? null;
      } else {
        data = result as IVerificacion | null;
      }
      return { data: data ? (toCamelCase(data) as IVerificacion) : null, meta: toCamelCase(meta) };
    },
    enabled: !!idBodega && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

// ─── Hooks de mutación ────────────────────────────────────────────────────────

export function useCreateVerificacion(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ICreateVerificacionInput) => {
      const response = await apiClient.post<IVerificacion | { data: IVerificacion; meta?: any }>(
        API_ENDPOINTS.BODEGAS.VERIFICACION_CREATE(idBodega),
        toSnakeCase(payload),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result) {
        return toCamelCase((result as { data: IVerificacion }).data) as IVerificacion;
      }
      return toCamelCase(result) as IVerificacion;
    },
    onSuccess: () => {
      toastSuccess('Se ha guardado la información correctamente.');
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.lista(idBodega) });
    },
  });
}

export function useUpdateVerificacion(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IUpdateVerificacionInput) => {
      const response = await apiClient.put<IVerificacion | { data: IVerificacion; meta?: any }>(
        API_ENDPOINTS.BODEGAS.VERIFICACION_UPDATE(idBodega, payload.id),
        toSnakeCase(payload),
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result) {
        return toCamelCase((result as { data: IVerificacion }).data) as IVerificacion;
      }
      return toCamelCase(result) as IVerificacion;
    },
    onSuccess: (_, payload) => {
      toastSuccess('Se ha guardado la información correctamente.');
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.lista(idBodega) });
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.detalle(idBodega, payload.id) });
    },
  });
}

export function useFinalizarVerificacion(idBodega: string | number) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: IFinalizarVerificacionInput) => {
      const form = new FormData();
      form.append('cedula_archivo', payload.cedula_archivo);
      form.append('finalizar_proceso', String(payload.finalizar_proceso ?? false));
      if (payload.generales?.observaciones_excepcionales) {
        form.append('generales', JSON.stringify( payload.generales));
      }
      const response = await apiClient.put<IVerificacion | { data: IVerificacion; meta?: any }>(
        API_ENDPOINTS.BODEGAS.VERIFICACION_FINALIZAR(idBodega, payload.id),
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result) {
        return toCamelCase((result as { data: IVerificacion }).data) as IVerificacion;
      }
      return toCamelCase(result) as IVerificacion;
    },
    onSuccess: (_, payload) => {
      toastSuccess('Verificación finalizada correctamente.');
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.lista(idBodega) });
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.detalle(idBodega, payload.id) });
      // Recargar el estado de la bodega para reevaluar la visibilidad de botones
      // (ej. "Nueva verificación" se oculta cuando la bodega queda en estado terminal).
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
      router.push(`/bodegas/${idBodega}/verificaciones`);
    },
    // El error lo maneja de manera general el interceptor de Axios, por lo que no es necesario mostrar un toast aquí
  });
}

export function useRevisarVerificacion(idBodega: string | number) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: IRevisarVerificacionInput) => {
      const response = await apiClient.put<IVerificacion | { data: IVerificacion; meta?: any }>(
        API_ENDPOINTS.BODEGAS.VERIFICACION_REVISAR(idBodega, payload.id),
        { resultado: payload.resultado, finalizar_proceso: payload.finalizar_proceso ?? false },
      );
      const result = response.data;
      if (result && typeof result === 'object' && 'data' in result) {
        return (result as { data: IVerificacion }).data;
      }
      return result as IVerificacion;
    },
    onSuccess: (_, payload) => {
      toastSuccess('Verificación revisada correctamente.');
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.lista(idBodega) });
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.detalle(idBodega, payload.id) });
      // Recargar el estado de la bodega para reevaluar la visibilidad de botones
      // (ej. "Nueva verificación" se oculta cuando la bodega queda en estado terminal).
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
      router.push(`/bodegas/${idBodega}/verificaciones`);
    },
  });
}

export function useEliminarVerificacion(idBodega: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idVerificacion: string | number) => {
      await apiClient.delete(API_ENDPOINTS.BODEGAS.VERIFICACION_DELETE(idBodega, idVerificacion));
    },
    onSuccess: () => {
      toastSuccess('Verificación eliminada correctamente.');
      queryClient.invalidateQueries({ queryKey: VERIFICACIONES_KEYS.lista(idBodega) });
      queryClient.invalidateQueries({ queryKey: BODEGAS_KEYS.detalle(idBodega) });
    },
  });
}
