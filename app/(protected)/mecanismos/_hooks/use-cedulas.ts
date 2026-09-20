'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ICedula,
  ICedulaAprobarPayload,
  ICedulaBandeja,
  ICedulaConsejo,
  ICedulaInformarPayload,
  ICedulaObservacionesPayload,
  ICedulaProponerPayload,
  ICedulaReemplazarPayload,
  ICedulasDocumentosResultado,
  ICedulasDocumentosValidacion,
  ICedulasResumenConsejo,
  IMecanismo,
  IMotivoPayload,
  TCedulaEstatus,
  TDiferenciaFiltro,
  TTipoConsejoChar,
} from '@/types/mecanismos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { armarFormData, MULTIPART } from '@/lib/archivos';
import { getDataAuditoria } from '@/lib/auditoria';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';

/** Filtros de la bandeja general; el valor vacío significa «todos». */
export interface ICedulasBandejaFiltros {
  estatus?: TCedulaEstatus | null;
  diferencia?: TDiferenciaFiltro | null;
  idConsejo?: number | null;
}

// ---------------------------------------------------------------- Consultas

/** Cédulas del consejo: una por mecanismo vinculado, con la acción que admite cada una. */
export function useCedulasConsejo(
  tipoConsejo: TTipoConsejoChar | null,
  idConsejo: number | null,
  habilitado = true,
) {
  return useQuery<ICedulaConsejo[]>({
    queryKey: MECANISMOS_KEYS.cedulasConsejo(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
    ),
    enabled: habilitado && !!tipoConsejo && !!idConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<ICedulaConsejo[]>(
        API_ENDPOINTS.MECANISMOS.CEDULAS(idConsejo!, tipoConsejo!),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

/** Resumen por consejo del tipo, aunque vayan en ceros; exclusivo de oficina central. */
export function useCedulasResumen(
  tipoConsejo: TTipoConsejoChar | null,
  habilitado = true,
) {
  return useQuery<ICedulasResumenConsejo[]>({
    queryKey: MECANISMOS_KEYS.cedulasResumen(tipoConsejo ?? 'NONE'),
    enabled: habilitado && !!tipoConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<ICedulasResumenConsejo[]>(
        API_ENDPOINTS.MECANISMOS.CEDULAS_RESUMEN(tipoConsejo!),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

/** Bandeja general de oficina central; estatus, diferencia y consejo se filtran en el servidor. */
export function useCedulasGeneral(
  tipoConsejo: TTipoConsejoChar | null,
  filtros: ICedulasBandejaFiltros = {},
  habilitado = true,
) {
  const estatus = filtros.estatus ?? null;
  const diferencia = filtros.diferencia ?? null;
  const idConsejo = filtros.idConsejo ?? null;

  return useQuery<ICedulaBandeja[]>({
    queryKey: MECANISMOS_KEYS.cedulasGeneral(
      tipoConsejo ?? 'NONE',
      estatus ?? 'TODOS',
      diferencia ?? 'TODAS',
      idConsejo ?? 0,
    ),
    enabled: habilitado && !!tipoConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<ICedulaBandeja[]>(
        API_ENDPOINTS.MECANISMOS.CEDULAS_GENERAL(tipoConsejo!, {
          estatus: estatus ?? undefined,
          diferencia: diferencia ?? undefined,
          idConsejo: idConsejo ?? undefined,
        }),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

/** Detalle de la cédula (por id del mecanismo) con revisiones e historial; solo con la ventana abierta. */
export function useCedula(id: number | null) {
  return useQuery<ICedula>({
    queryKey: MECANISMOS_KEYS.cedula(id ?? 0),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<ICedula>(
        API_ENDPOINTS.MECANISMOS.CEDULA(id!),
      );
      return data;
    },
  });
}

// ---------------------------------------------------------------- Escrituras

/**
 * Cualquier escritura sobre la cédula cambia el mecanismo (comparten registro):
 * se rehacen las cédulas, las listas de mecanismos y el seguimiento. El detalle
 * de la cédula se retira de la caché para pedirse completo la próxima vez.
 */
function invalidarCedulas(
  queryClient: ReturnType<typeof useQueryClient>,
  idMecanismo?: number,
) {
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.cedulas() });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.mecanismos() });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.seguimiento() });
  if (idMecanismo) {
    queryClient.removeQueries({
      queryKey: MECANISMOS_KEYS.cedula(idMecanismo),
    });
  }
}

/** Oficina central propone la cédula del mecanismo: PDF del INE y costo INE. */
export function useProponerCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id_mecanismo,
      costo_ine,
      archivo,
    }: ICedulaProponerPayload) => {
      const { data } = await apiClient.post<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CEDULA_PROPONER,
        armarFormData(archivo, { id_mecanismo, costo_ine }),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      invalidarCedulas(queryClient, mecanismo.id);
      toastSuccess('Cédula propuesta; los consejos ya pueden informar.');
    },
  });
}

/** Reemplaza el PDF propuesto, el costo INE o ambos; los consejos vuelven a informar. */
export function useReemplazarPropuestaCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: ICedulaReemplazarPayload;
    }) => {
      const { data } = await apiClient.put<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CEDULA_PROPUESTA(id),
        armarFormData(payload.archivo, { costo_ine: payload.costo_ine }),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      invalidarCedulas(queryClient, mecanismo.id);
      toastSuccess(
        'Propuesta reemplazada; los consejos deberán informar de nuevo.',
      );
    },
  });
}

/** El consejo informa su costo cotizado (si su configuración lo pide) y observaciones. */
export function useInformarCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: ICedulaInformarPayload;
    }) => {
      const { data } = await apiClient.put<ICedula>(
        API_ENDPOINTS.MECANISMOS.CEDULA_INFORME(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (cedula) => {
      queryClient.setQueryData(
        MECANISMOS_KEYS.cedula(cedula.mecanismo.id),
        cedula,
      );
      invalidarCedulas(queryClient);
      toastSuccess('Cédula informada.');
    },
  });
}

/** Oficina central aprueba con el PDF aprobado y el costo autorizado. */
export function useAprobarCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: ICedulaAprobarPayload;
    }) => {
      const { data } = await apiClient.post<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CEDULA_APROBAR(id),
        armarFormData(payload.archivo, {
          costo_autorizado: payload.costo_autorizado,
        }),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      invalidarCedulas(queryClient, mecanismo.id);
      toastSuccess('Cédula aprobada; los consejos ya pueden acusar.');
    },
  });
}

/** El consejo acusa la cédula aprobada; el estatus no cambia. */
export function useAcusarCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: ICedulaObservacionesPayload;
    }) => {
      const { data } = await apiClient.post<ICedula>(
        API_ENDPOINTS.MECANISMOS.CEDULA_ACUSE(id),
        { observaciones: payload.observaciones || null, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (cedula) => {
      queryClient.setQueryData(
        MECANISMOS_KEYS.cedula(cedula.mecanismo.id),
        cedula,
      );
      invalidarCedulas(queryClient);
      toastSuccess('Acuse registrado.');
    },
  });
}

/** Oficina central cierra la cédula aprobada. */
export function useCerrarCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: ICedulaObservacionesPayload;
    }) => {
      const { data } = await apiClient.post<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CEDULA_CERRAR(id),
        { observaciones: payload.observaciones || null, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      invalidarCedulas(queryClient, mecanismo.id);
      toastSuccess('Cédula cerrada.');
    },
  });
}

/** Anula la cédula desde cualquier estatus, con motivo; el mecanismo admite una propuesta nueva. */
export function useAnularCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number } & IMotivoPayload) => {
      const { data } = await apiClient.post<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CEDULA_ANULAR(id),
        { motivo, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      invalidarCedulas(queryClient, mecanismo.id);
      toastSuccess(
        'Cédula anulada; el mecanismo puede recibir una propuesta nueva.',
      );
    },
  });
}

// ---------------------------------------------------------------- Documentos

/** URL firmada (30 minutos) del PDF propuesto o del aprobado, para el visor en ventana. */
export function useUrlDocumentoCedula() {
  return useMutation({
    mutationFn: async ({
      id,
      cual,
    }: {
      id: number;
      cual: 'propuesta' | 'aprobada';
    }) => {
      const { data } = await apiClient.get<string>(
        cual === 'propuesta'
          ? API_ENDPOINTS.MECANISMOS.CEDULA_PROPUESTA(id)
          : API_ENDPOINTS.MECANISMOS.CEDULA_APROBADA(id),
      );
      return data;
    },
  });
}

/** Revisa el zip de PDF y devuelve el emparejamiento por nombre, sin guardar nada. */
export function useValidarDocumentosCedulas() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<ICedulasDocumentosValidacion>(
        API_ENDPOINTS.MECANISMOS.CEDULAS_DOCUMENTOS_VALIDAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Aplica el zip: sube los PDF válidos y deja las cédulas en Propuesta (crea el mecanismo si no existe). */
export function useImportarDocumentosCedulas() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<ICedulasDocumentosResultado>(
        API_ENDPOINTS.MECANISMOS.CEDULAS_DOCUMENTOS,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => {
      invalidarCedulas(queryClient);
      queryClient.invalidateQueries({
        queryKey: MECANISMOS_KEYS.importaciones(),
      });
    },
  });
}
