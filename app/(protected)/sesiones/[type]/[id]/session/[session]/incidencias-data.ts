'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toastSuccess, toastError } from '@/lib/toast';

// ─── Tipos catálogo ───────────────────────────────────────────────────────────

export interface ICatalogoIncidencia {
  id: number;
  incidencia: string;
  periodo: string;
}

/** Catálogo agrupado por periodo */
export type ICatalogoIncidenciasPorPeriodo = Record<string, ICatalogoIncidencia[]>;

// ─── Tipos incidencia de sesión ───────────────────────────────────────────────

export interface ISeguimiento {
  id: number;
  id_sesion: number;
  id_incidencia: number;
  seguimiento: string;
  fecha_registro: string;
}

export interface IIncidencia {
  id: number;
  id_sesion: number;
  incidencia: string;
  periodo: string;
  status: 'ABIERTA' | 'CERRADA';
  seguimiento: ISeguimiento[] | null;
  fecha: string;
}

export interface ICrearIncidenciaInput {
  id_catalogo: number;
  periodo: string;
  incidencia: string;
}

export interface IGuardarSeguimientoInput {
  id_incidencia: number;
  id_sesion: string;
  seguimiento: string;
  status?: 'CERRADA';
}

// ─── Query keys ───────────────────────────────────────────────────────────────

const QK_CATALOGO = 'catalogo-incidencias' as const;
const QK_INCIDENCIAS = 'sesion-incidencias' as const;

// ─── Catálogo ─────────────────────────────────────────────────────────────────

export function useCatalogoIncidencias() {
  return useQuery({
    queryKey: [QK_CATALOGO],
    queryFn: async (): Promise<ICatalogoIncidenciasPorPeriodo> => {
      const { data } = await apiClient.get<{ tipos_incidencias: ICatalogoIncidencia[] }>(
        API_ENDPOINTS.CATALOGOS.LIST('INCIDENCIAS'),
      );
      const items = Array.isArray(data?.tipos_incidencias) ? data.tipos_incidencias : [];
      return items.reduce<ICatalogoIncidenciasPorPeriodo>((acc, item) => {
        if (!acc[item.periodo]) acc[item.periodo] = [];
        acc[item.periodo].push(item);
        return acc;
      }, {});
    },
    staleTime: 5 * 60_000, // catálogo cambia poco
  });
}

// ─── Incidencias de sesión ────────────────────────────────────────────────────

export function useIncidenciasSesion(idSesion: string) {
  return useQuery({
    queryKey: [QK_INCIDENCIAS, idSesion],
    queryFn: async (): Promise<IIncidencia[]> => {
      const { data } = await apiClient.get<IIncidencia[]>(
        API_ENDPOINTS.SESIONES.INCIDENCIAS(idSesion),
      );
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCrearIncidencia(idSesion: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICrearIncidenciaInput) =>
      apiClient.post<IIncidencia>(
        API_ENDPOINTS.SESIONES.INCIDENCIAS(idSesion),
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_INCIDENCIAS, idSesion] });
      toastSuccess('Incidencia registrada correctamente.');
    },
    onError: () => toastError('No se pudo registrar la incidencia.'),
  });
}

export function useGuardarSeguimiento(idSesion: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IGuardarSeguimientoInput) =>
      apiClient.put(
        API_ENDPOINTS.SESIONES.INCIDENCIA_SEGUIMIENTO(idSesion),
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_INCIDENCIAS, idSesion] });
      toastSuccess('Seguimiento guardado correctamente.');
    },
    onError: () => toastError('No se pudo guardar el seguimiento.'),
  });
}

export function useEliminarIncidencia(idSesion: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idIncidencia: number) =>
      apiClient.delete(
        API_ENDPOINTS.SESIONES.ELIMINAR_INCIDENCIA(idSesion, idIncidencia),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_INCIDENCIAS, idSesion] });
      toastSuccess('Incidencia eliminada.');
    },
    onError: () => toastError('No se pudo eliminar la incidencia.'),
  });
}
