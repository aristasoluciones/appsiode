'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IEstudio,
  IEstudioAcusarPayload,
  IEstudioConsejo,
  IEstudioProponerPayload,
  IEstudioPropuesta,
  IEstudiosAvance,
  IMotivoPayload,
  TTipoConsejoChar,
} from '@/types/mecanismos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { armarFormData, MULTIPART } from '@/lib/archivos';
import { getDataAuditoria } from '@/lib/auditoria';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';

/** Avance vacío, para que el tablero siempre reciba la misma forma. */
const SIN_AVANCE: IEstudiosAvance = {
  resumen: {
    distritos: 0,
    cargados: 0,
    porcentaje_cargados: 0,
    validados: 0,
    porcentaje_validados: 0,
    sin_estudio: 0,
    propuestos: 0,
    aprobados: 0,
    cerrados: 0,
    anulados: 0,
    consejos_esperados: 0,
    acuses_etapa1: 0,
    porcentaje_acuses_etapa1: 0,
    acuses_etapa2: 0,
    porcentaje_acuses_etapa2: 0,
    ultima_carga: null,
  },
  distritos: [],
};

// ---------------------------------------------------------------- Consultas

/** Estudios de los distritos federales del consejo, aunque aún no existan, con su acuse. */
export function useEstudiosConsejo(
  tipoConsejo: TTipoConsejoChar | null,
  idConsejo: number | null,
  habilitado = true,
) {
  return useQuery<IEstudioConsejo[]>({
    queryKey: MECANISMOS_KEYS.estudiosConsejo(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
    ),
    enabled: habilitado && !!tipoConsejo && !!idConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IEstudioConsejo[]>(
        API_ENDPOINTS.MECANISMOS.ESTUDIOS(idConsejo!, tipoConsejo!),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

/**
 * Tablero de oficina central: totales del estado y un renglón por cada uno de
 * los 13 distritos federales. El filtrado se hace en pantalla, sobre lo recibido.
 */
export function useEstudiosAvance(habilitado = true) {
  return useQuery<IEstudiosAvance>({
    queryKey: MECANISMOS_KEYS.estudiosAvance(),
    enabled: habilitado,
    queryFn: async () => {
      const { data } = await apiClient.get<IEstudiosAvance>(
        API_ENDPOINTS.MECANISMOS.ESTUDIOS_AVANCE,
      );
      return data ? { ...data, distritos: data.distritos ?? [] } : SIN_AVANCE;
    },
    staleTime: 30_000,
  });
}

/** Detalle del estudio con acuses e historial; solo con la ventana abierta. */
export function useEstudio(id: number | null) {
  return useQuery<IEstudio>({
    queryKey: MECANISMOS_KEYS.estudio(id ?? 0),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO(id!),
      );
      return data;
    },
  });
}

// ---------------------------------------------------------------- Escrituras

/**
 * Cada escritura recibe el estudio completo y lo deja en caché; se rehacen las
 * listas del consejo y el avance sin volver a pedir el detalle.
 */
function guardarEstudioEnCache(
  queryClient: ReturnType<typeof useQueryClient>,
  estudio: IEstudio,
) {
  queryClient.setQueryData(MECANISMOS_KEYS.estudio(estudio.id), estudio);
  queryClient.invalidateQueries({
    queryKey: MECANISMOS_KEYS.estudios(),
    predicate: (q) => q.queryKey[2] !== 'detalle',
  });
}

/** Oficina central propone el estudio de un distrito federal; se crean los acuses de sus consejos. */
export function useProponerEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id_df, archivo }: IEstudioProponerPayload) => {
      const { data } = await apiClient.post<IEstudioPropuesta>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_PROPONER,
        armarFormData(archivo, { id_df }),
        MULTIPART,
      );
      return data;
    },
    onSuccess: ({ estudio }) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess(
        'Estudio propuesto; los consejos del distrito ya pueden acusar.',
      );
    },
  });
}

/** Reemplaza el PDF propuesto mientras el estudio esté propuesto; los acuses se piden de nuevo. */
export function useReemplazarPropuestaEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archivo }: { id: number; archivo: File }) => {
      const { data } = await apiClient.put<IEstudioPropuesta>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_PROPUESTA(id),
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: ({ estudio }) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess(
        'Documento reemplazado; los consejos deberán acusar de nuevo.',
      );
    },
  });
}

/** Oficina central aprueba con el PDF aprobado, cuando todos los consejos acusaron la propuesta. */
export function useAprobarEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archivo }: { id: number; archivo: File }) => {
      const { data } = await apiClient.post<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_APROBAR(id),
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (estudio) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess('Estudio aprobado; los consejos ya pueden acusar.');
    },
  });
}

/** El consejo acusa la etapa vigente (1 propuesto, 2 aprobado); el último acuse de la 2 cierra el estudio. */
export function useAcusarEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IEstudioAcusarPayload;
    }) => {
      const { data } = await apiClient.post<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_ACUSE(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (estudio) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess('Acuse registrado.');
    },
  });
}

/** Anula el estudio con motivo; el distrito puede recibir uno nuevo. */
export function useAnularEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number } & IMotivoPayload) => {
      const { data } = await apiClient.post<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_ANULAR(id),
        { motivo, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (estudio) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess('Estudio anulado; el distrito puede recibir uno nuevo.');
    },
  });
}

// ---------------------------------------------------------------- Documentos

/** URL firmada (30 minutos) del PDF propuesto o del aprobado, para el visor en ventana. */
export function useUrlDocumentoEstudio() {
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
          ? API_ENDPOINTS.MECANISMOS.ESTUDIO_PROPUESTA(id)
          : API_ENDPOINTS.MECANISMOS.ESTUDIO_APROBADA(id),
      );
      return data;
    },
  });
}
