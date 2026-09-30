'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  ICedulasDocumentosResultado,
  ICedulasDocumentosValidacion,
  IImportacion,
  IImportacionDetalle,
  IImportacionReversion,
  IMecanismosImportacionResultado,
  IMecanismosImportacionValidacion,
  IMotivoPayload,
  TImportacionTipo,
} from '@/types/mecanismos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { armarFormData, MULTIPART } from '@/lib/archivos';
import { getDataAuditoria } from '@/lib/auditoria';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';

/**
 * Una carga o una reversión crea, cambia o elimina mecanismos o sus cédulas:
 * se rehacen las listas, el seguimiento, las URL firmadas y el historial.
 */
export function invalidarTrasImportacion(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.mecanismos() });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.seguimiento() });
  queryClient.removeQueries({ queryKey: MECANISMOS_KEYS.cedulas() });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.importaciones() });
}

/**
 * Revisa el formato de importación completo y devuelve la vista previa. No guarda nada.
 * La pantalla muestra el error en su propia alerta.
 */
export function useValidarImportacionMecanismos() {
  return useMutation({
    mutationKey: MECANISMOS_KEYS.importacionesEnCurso(),
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IMecanismosImportacionValidacion>(
        API_ENDPOINTS.MECANISMOS.IMPORTAR_VALIDAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Importa el formato: todo o nada. Un renglón con observaciones detiene la carga. */
export function useImportarMecanismos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: MECANISMOS_KEYS.importacionesEnCurso(),
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IMecanismosImportacionResultado>(
        API_ENDPOINTS.MECANISMOS.IMPORTAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => invalidarTrasImportacion(queryClient),
  });
}

/** Revisa el zip de PDF de cédula y devuelve el emparejamiento por número de mecanismo, sin guardar nada. */
export function useValidarImportacionCedulas() {
  return useMutation({
    mutationKey: MECANISMOS_KEYS.importacionesEnCurso(),
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<ICedulasDocumentosValidacion>(
        API_ENDPOINTS.MECANISMOS.IMPORTAR_CEDULAS_VALIDAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Aplica el zip: carga o reemplaza la cédula de cada mecanismo emparejado (crea el mecanismo si no existe). */
export function useImportarCedulas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: MECANISMOS_KEYS.importacionesEnCurso(),
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<ICedulasDocumentosResultado>(
        API_ENDPOINTS.MECANISMOS.IMPORTAR_CEDULAS,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => invalidarTrasImportacion(queryClient),
  });
}

/** Historial de cargas del proceso; sin `tipo` vienen todas (mecanismos, cédulas, CAE). */
export function useImportacionesMecanismos(
  tipo?: TImportacionTipo,
  habilitado = true,
) {
  return useQuery({
    enabled: habilitado,
    queryKey: MECANISMOS_KEYS.importacionesTipo(tipo ?? 'TODAS'),
    queryFn: async () => {
      const { data } = await apiClient.get<IImportacion[]>(
        API_ENDPOINTS.MECANISMOS.IMPORTACIONES(tipo),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

/** Detalle paginado de una importación de mecanismos; conserva la página anterior mientras carga. */
export function useImportacionMecanismos(
  id: number | null,
  pagina = 1,
  porPagina = 100,
) {
  return useQuery<IImportacionDetalle>({
    enabled: !!id,
    queryKey: MECANISMOS_KEYS.importacionDetalle(id ?? 0, pagina),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.get<IImportacionDetalle>(
        API_ENDPOINTS.MECANISMOS.IMPORTACION(id!, pagina, porPagina),
      );
      return { ...data, items: data?.items ?? [] };
    },
    staleTime: 60_000,
  });
}

/**
 * Revierte la importación de mecanismos más reciente. El API la rechaza (409)
 * si algún mecanismo de la carga ya tiene informe, observaciones o cédula; la
 * pantalla lo muestra en su alerta.
 */
export function useRevertirImportacionMecanismos() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({ id, motivo }: { id: number } & IMotivoPayload) => {
      const { data } = await apiClient.post<IImportacionReversion>(
        API_ENDPOINTS.MECANISMOS.IMPORTACION_REVERTIR(id),
        { motivo, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (resultado) => {
      invalidarTrasImportacion(queryClient);
      toastSuccess(
        `Importación revertida: ${resultado.eliminados} mecanismos eliminados y ${resultado.restaurados} regresados a su estado anterior.`,
      );
    },
  });
}
