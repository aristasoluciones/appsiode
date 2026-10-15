'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IEstudio,
  IEstudioConsejo,
  IEstudioProponerPayload,
  IEstudioRevisarPayload,
  IEstudioRevocarPayload,
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
    anulados: 0,
    consejos_esperados: 0,
    revisiones: 0,
    revisiones_d: 0,
    revisiones_m: 0,
    porcentaje_revisiones: 0,
    observaciones: 0,
    ultima_carga: null,
  },
  distritos: [],
};

// ---------------------------------------------------------------- Consultas

/** Estudios de los distritos federales del consejo, aunque aún no existan, con su revisión. */
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
      return (data ?? [])
        .map((e) => ({
          ...e,
          revisiones: e.revisiones ?? 0,
          total_consejos: e.total_consejos ?? 0,
          total_observaciones: e.total_observaciones ?? 0,
        }))
        .sort((a, b) => a.id_df - b.id_df);
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
      if (!data) return SIN_AVANCE;
      // Los conteos se suman en pantalla: uno nulo daría NaN en los indicadores.
      return {
        ...data,
        distritos: (data.distritos ?? [])
          .map((d) => ({
            ...d,
            consejos: d.consejos ?? 0,
            revisiones: d.revisiones ?? 0,
            revisiones_d: d.revisiones_d ?? 0,
            revisiones_m: d.revisiones_m ?? 0,
            consejos_d: d.consejos_d ?? 0,
            consejos_m: d.consejos_m ?? 0,
            porcentaje_revisiones: d.porcentaje_revisiones ?? 0,
            observaciones: d.observaciones ?? 0,
            observaciones_tipos: d.observaciones_tipos ?? [],
          }))
          // Siempre en el orden del distrito federal (01 a 13), en tabla, listas y exportación.
          .sort((a, b) => a.id_df - b.id_df),
      };
    },
    staleTime: 30_000,
  });
}

/** Detalle del estudio con la revisión de cada consejo e historial; solo con la ventana abierta. */
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
    // La URL firmada del PDF no se toca: renovarla recargaría el visor; solo cambia al reemplazar el documento.
    predicate: (q) =>
      q.queryKey[2] !== 'detalle' && q.queryKey[2] !== 'documento',
  });
}

/** Oficina central propone el estudio de un distrito federal; sus consejos ya pueden revisarlo. */
export function useProponerEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id_df, archivo }: IEstudioProponerPayload) => {
      const { data } = await apiClient.post<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_PROPONER,
        armarFormData(archivo, { id_df }),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (estudio) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess(
        'Estudio propuesto; los consejos del distrito ya pueden revisarlo.',
      );
    },
  });
}

/** Reemplaza el PDF propuesto mientras el estudio esté propuesto; los consejos vuelven a Sin revisar y conservan sus observaciones. */
export function useReemplazarPropuestaEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archivo }: { id: number; archivo: File }) => {
      const { data } = await apiClient.put<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_PROPUESTA(id),
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (estudio) => {
      guardarEstudioEnCache(queryClient, estudio);
      // El PDF cambió: la vista previa pide la URL del nuevo.
      queryClient.invalidateQueries({
        queryKey: MECANISMOS_KEYS.estudioDocumento(estudio.id, 'propuesta'),
      });
      toastSuccess(
        'Documento reemplazado; los consejos deberán revisarlo de nuevo.',
      );
    },
  });
}

/** Oficina central aprueba con el PDF aprobado, cuando todos los consejos revisaron la propuesta; queda como versión final. */
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
      toastSuccess('Estudio aprobado.');
    },
  });
}

/**
 * Revisión del consejo: cada guardado agrega una observación tipificada; con
 * `revisar` el consejo queda Revisado y ya no admite más hasta que se revoque.
 */
export function useRevisarEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IEstudioRevisarPayload;
    }) => {
      const { data } = await apiClient.put<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_REVISION(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (estudio, { payload }) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess(
        payload.revisar ? 'Estudio revisado.' : 'Observación registrada.',
      );
    },
  });
}

/** Oficina central revoca la revisión de un consejo; conserva sus observaciones. */
export function useRevocarRevisionEstudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IEstudioRevocarPayload;
    }) => {
      const { data } = await apiClient.post<IEstudio>(
        API_ENDPOINTS.MECANISMOS.ESTUDIO_REVISION_REVOCAR(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (estudio) => {
      guardarEstudioEnCache(queryClient, estudio);
      toastSuccess('Revisión revocada; el consejo puede capturar de nuevo.');
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

/**
 * URL firmada del PDF propuesto o aprobado para la vista previa en ventana. La
 * firma dura 30 minutos; se pide de nuevo pasados 10 o al reemplazar el PDF.
 */
export function useDocumentoEstudio(
  id: number | null,
  cual: 'propuesta' | 'aprobada',
  habilitado = true,
) {
  return useQuery<string>({
    queryKey: MECANISMOS_KEYS.estudioDocumento(id ?? 0, cual),
    enabled: habilitado && !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<string>(
        cual === 'propuesta'
          ? API_ENDPOINTS.MECANISMOS.ESTUDIO_PROPUESTA(id!)
          : API_ENDPOINTS.MECANISMOS.ESTUDIO_APROBADA(id!),
      );
      return data;
    },
    staleTime: 10 * 60_000,
  });
}
