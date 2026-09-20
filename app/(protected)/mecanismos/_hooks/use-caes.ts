'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ICaesAsignacionResultado,
  ICaesCatalogo,
  ICaesImportacionResultado,
  TTipoConsejoChar,
} from '@/types/mecanismos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { armarFormData, MULTIPART } from '@/lib/archivos';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
import { useDescargaExcel } from '@/hooks/use-descarga-excel';

/** Catálogo vacío, para que la pantalla siempre reciba la misma forma. */
const SIN_CAES: ICaesCatalogo = { fuente: 'TABLA', api_base: null, caes: [] };

/**
 * Catálogo de CAE. El consejo recibe los suyos (el API toma el consejo del
 * token); oficina central, los del consejo indicado o todos los del proceso.
 * `fuente` dice si vienen de la tabla semilla o del sistema que los administra.
 */
export function useCaes(
  filtros: {
    tipoConsejo?: TTipoConsejoChar | null;
    idConsejo?: number | null;
    incluirInactivos?: boolean;
  } = {},
  habilitado = true,
) {
  const tipoConsejo = filtros.tipoConsejo ?? null;
  const idConsejo = filtros.idConsejo ?? null;
  const incluirInactivos = filtros.incluirInactivos ?? false;

  return useQuery<ICaesCatalogo>({
    enabled: habilitado,
    queryKey: MECANISMOS_KEYS.caesLista(
      tipoConsejo ?? 'TODOS',
      idConsejo ?? 0,
      incluirInactivos,
    ),
    queryFn: async () => {
      const { data } = await apiClient.get<ICaesCatalogo>(
        API_ENDPOINTS.MECANISMOS.CAES({
          tipoConsejo: tipoConsejo ?? undefined,
          idConsejo: idConsejo ?? undefined,
          incluirInactivos,
        }),
      );
      return data ? { ...data, caes: data.caes ?? [] } : SIN_CAES;
    },
    staleTime: 60_000,
  });
}

/** El listado o la asignación cambian el catálogo y el CAE de los mecanismos. */
function invalidarTrasCargaDeCaes(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.caes() });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.mecanismos() });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.seguimiento() });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.importaciones() });
}

const ERROR_FORMATO = 'No se pudo descargar el formato. Intenta nuevamente.';

// ---------------------------------------------------------------- Listado de CAE (oficina central)

/** Formato del listado de CAE con los que ya existen en el proceso. */
export function useDescargarFormatoListadoCaes() {
  return useDescargaExcel<void>(
    () => API_ENDPOINTS.MECANISMOS.CAES_IMPORTAR_FORMATO,
    () => 'listado-cae.xlsx',
    ERROR_FORMATO,
  );
}

/** Revisa el listado de CAE y devuelve la vista previa, sin guardar nada. */
export function useValidarListadoCaes() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<ICaesImportacionResultado>(
        API_ENDPOINTS.MECANISMOS.CAES_IMPORTAR_VALIDAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Aplica el listado: alta por folio nuevo y actualización del existente. */
export function useImportarListadoCaes() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<ICaesImportacionResultado>(
        API_ENDPOINTS.MECANISMOS.CAES_IMPORTAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => invalidarTrasCargaDeCaes(queryClient),
  });
}

// ---------------------------------------------------------------- Asignación masiva (oficina central)

export interface ICaesAsignacionArchivo {
  archivo: File;
  tipoConsejo: TTipoConsejoChar;
  /** Opcional: acota la asignación a un consejo. */
  idConsejo?: number | null;
}

/** Formato de asignación con los mecanismos del tipo (o de un consejo) y la columna del folio. */
export function useDescargarFormatoAsignacionCaes() {
  return useDescargaExcel<{
    tipoConsejo: TTipoConsejoChar;
    idConsejo?: number | null;
  }>(
    ({ tipoConsejo, idConsejo }) =>
      API_ENDPOINTS.MECANISMOS.CAES_ASIGNACION_FORMATO(
        tipoConsejo,
        idConsejo ?? undefined,
      ),
    ({ tipoConsejo }) =>
      tipoConsejo === 'D'
        ? 'asignacion-cae-distritales.xlsx'
        : 'asignacion-cae-municipales.xlsx',
    ERROR_FORMATO,
  );
}

/** Revisa el Excel de asignación y devuelve el resultado renglón por renglón, sin guardar. */
export function useValidarAsignacionCaes() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({
      archivo,
      tipoConsejo,
      idConsejo,
    }: ICaesAsignacionArchivo) => {
      const { data } = await apiClient.post<ICaesAsignacionResultado>(
        API_ENDPOINTS.MECANISMOS.CAES_ASIGNACION_VALIDAR,
        armarFormData(archivo, { tipoConsejo, idConsejo }),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Aplica la asignación masiva: los renglones válidos se asignan y quedan en el historial. */
export function useAsignarCaes() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({
      archivo,
      tipoConsejo,
      idConsejo,
    }: ICaesAsignacionArchivo) => {
      const { data } = await apiClient.post<ICaesAsignacionResultado>(
        API_ENDPOINTS.MECANISMOS.CAES_ASIGNACION,
        armarFormData(archivo, { tipoConsejo, idConsejo }),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => invalidarTrasCargaDeCaes(queryClient),
  });
}
