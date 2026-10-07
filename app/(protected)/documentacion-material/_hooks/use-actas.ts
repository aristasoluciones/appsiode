'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IActa,
  IActaFotografia,
  IActaFotografiaEliminada,
  IActaFotografiaSubida,
  IActaGenerarPayload,
  IActasConsejo,
  IActasResumen,
} from '@/types/material-electoral';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { MATERIAL_ELECTORAL_KEYS } from '@/lib/query-keys';
import { toastError, toastSuccess } from '@/lib/toast';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

const TIPO_WORD =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Dispara la descarga de un archivo ya en memoria. */
function descargar(contenido: Blob, nombreArchivo: string) {
  const url = window.URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  window.URL.revokeObjectURL(url);
}

/** Abre una URL firmada en otra pestaña; el navegador decide si la muestra o la descarga. */
function abrirEnPestana(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** El archivo se envía como multipart junto con la auditoría y los campos extra. */
function armarFormData(archivo: File, extra: Record<string, string> = {}) {
  const { dispositivo, mac } = getDataAuditoria();
  const form = new FormData();
  form.append('archivo', archivo);
  form.append('dispositivo', dispositivo);
  form.append('mac', mac);
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return form;
}

/**
 * Lee el mensaje de error del cuerpo binario de una respuesta: la vista previa
 * responde un Word, pero un rechazo llega como JSON dentro del blob.
 */
async function mensajeDeBlob(error: unknown): Promise<string | null> {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!(data instanceof Blob)) return null;
  try {
    const json = JSON.parse(await data.text()) as { message?: string };
    return json?.message ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Consultas

/**
 * Actas del consejo con su borrador, el motivo de bloqueo del generador, si
 * hay configuración vigente y los renglones que ningún acta aceptada ampara.
 */
export function useActasConsejo(
  tipoConsejo: 'D' | 'M' | null,
  idConsejo: number | null,
) {
  return useQuery<IActasConsejo>({
    queryKey: MATERIAL_ELECTORAL_KEYS.actasConsejo(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
    ),
    enabled: !!tipoConsejo && !!idConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IActasConsejo>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS(idConsejo!, tipoConsejo!),
      );
      return { ...data, actas: data?.actas ?? [] };
    },
    staleTime: 30_000,
  });
}

/** Detalle del acta; solo se pide con la ventana abierta. */
export function useActa(id: number | null) {
  return useQuery<IActa>({
    queryKey: MATERIAL_ELECTORAL_KEYS.acta(id ?? 0),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA(id!),
      );
      return data;
    },
  });
}

// ---------------------------------------------------------------- Borrador

/**
 * Cualquier escritura rehace el listado del consejo y el resumen de oficina
 * central. El detalle NO se invalida: cada escritura ya recibe el acta completa
 * del servidor y la deja en caché con `setQueryData`; volver a pedirla abriría
 * una ventana en la que una respuesta vieja pisara lo recién guardado.
 */
function invalidarActas(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: MATERIAL_ELECTORAL_KEYS.actas(),
    predicate: (q) => q.queryKey[2] !== 'detalle',
  });
}

/** Abre un borrador que reserva los tipos de artículo elegidos; el consejo puede tener varios con tipos distintos. */
export function useAbrirBorrador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tiposArticulo: string[]) => {
      const { data } = await apiClient.post<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_BORRADOR,
        { ...getDataAuditoria(), tipos_articulo: tiposArticulo },
      );
      return data;
    },
    onSuccess: (acta) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
    },
  });
}

/** Cambia los tipos de artículo que reserva un borrador, siempre que estén libres. */
export function useCambiarTiposBorrador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tipos }: { id: number; tipos: string[] }) => {
      const { data } = await apiClient.put<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_BORRADOR_TIPOS(id),
        { ...getDataAuditoria(), tipos_articulo: tipos },
      );
      return data;
    },
    onSuccess: (acta) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
    },
  });
}

/** Elimina el borrador de verdad, con sus fotografías. */
export function useEliminarBorrador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete<{ id: number }>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_BORRADOR_ELIMINAR(id),
        { data: getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (_data, id) => {
      // El detalle del borrador se retira de la caché sin volver a pedirlo:
      // ya no existe y el servidor respondería «no existe» con su toast.
      queryClient.removeQueries({ queryKey: MATERIAL_ELECTORAL_KEYS.acta(id) });
      invalidarActas(queryClient);
      toastSuccess('El borrador y sus fotografías se eliminaron.');
    },
  });
}

// ---------------------------------------------------------------- Fotografías

/**
 * Reemplaza el avance de apartados y la lista de fotografías en el detalle en
 * caché. Antes cancela cualquier lectura del detalle que vaya en vuelo (por
 * ejemplo, la de recuperar el foco de la ventana): si llegara después, traería
 * la lista sin la fotografía recién subida y la quitaría de pantalla.
 */
async function actualizarFotografiasEnCache(
  queryClient: ReturnType<typeof useQueryClient>,
  idActa: number,
  cambio: (acta: IActa) => IActa,
) {
  await queryClient.cancelQueries({
    queryKey: MATERIAL_ELECTORAL_KEYS.acta(idActa),
  });
  queryClient.setQueryData<IActa>(
    MATERIAL_ELECTORAL_KEYS.acta(idActa),
    (actual) => (actual ? cambio(actual) : actual),
  );
}

/** Sube una fotografía a un apartado; la API la valida, recomprime y devuelve el avance. */
export function useSubirFotografiaActa(idActa: number) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({
      archivo,
      apartado,
    }: {
      archivo: File;
      apartado: string;
    }) => {
      const { data } = await apiClient.post<IActaFotografiaSubida>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_FOTOGRAFIAS(idActa),
        armarFormData(archivo, { apartado }),
        MULTIPART,
      );
      return data;
    },
    onSuccess: async (foto) => {
      const { apartados, ...resto } = foto;
      const nueva: IActaFotografia = {
        id: resto.id,
        apartado: resto.apartado,
        archivo: resto.archivo,
        orden: resto.orden,
        imagen_url: resto.imagen_url ?? null,
        miniatura_url: resto.miniatura_url ?? null,
      };
      await actualizarFotografiasEnCache(queryClient, idActa, (acta) => ({
        ...acta,
        configuracion: { ...acta.configuracion, apartados },
        fotografias: [...acta.fotografias, nueva],
      }));
    },
  });
}

/** Quita una fotografía del acta; el archivo se retira del almacenamiento. */
export function useEliminarFotografiaActa(idActa: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idFotografia: number) => {
      const { data } = await apiClient.delete<IActaFotografiaEliminada>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_FOTOGRAFIA(idActa, idFotografia),
        { data: getDataAuditoria() },
      );
      return data;
    },
    onSuccess: async (resultado) => {
      await actualizarFotografiasEnCache(queryClient, idActa, (acta) => ({
        ...acta,
        configuracion: {
          ...acta.configuracion,
          apartados: resultado.apartados,
        },
        fotografias: acta.fotografias.filter((f) => f.id !== resultado.id),
      }));
    },
  });
}

/** Orden nuevo de las fotografías de un apartado: todos sus ids en el orden deseado. */
export function useReordenarFotografiasActa(idActa: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      apartado,
      ids,
    }: {
      apartado: string;
      ids: number[];
    }) => {
      const { data } = await apiClient.put<IActaFotografia[]>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_FOTOGRAFIAS_ORDEN(idActa),
        { apartado, ids, ...getDataAuditoria() },
      );
      return { apartado, fotografias: data };
    },
    onSuccess: async ({ apartado, fotografias }) => {
      await actualizarFotografiasEnCache(queryClient, idActa, (acta) => ({
        ...acta,
        fotografias: [
          ...acta.fotografias.filter((f) => f.apartado !== apartado),
          ...fotografias,
        ],
      }));
    },
  });
}

// ---------------------------------------------------------------- Documento

/**
 * Word con los datos capturados y el corte al momento; no guarda nada. El error
 * se lee aquí porque la respuesta es binaria y el toast global no puede abrirla.
 */
export function useVistaPreviaActa() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (payload: IActaGenerarPayload) => {
      const response = await apiClient.post(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_VISTA_PREVIA,
        payload,
        { responseType: 'blob' },
      );
      return response.data as Blob;
    },
    onSuccess: (contenido) =>
      descargar(
        new Blob([contenido], { type: TIPO_WORD }),
        'acta-circunstanciada-vista-previa.docx',
      ),
    onError: async (error) => {
      toastError(
        (await mensajeDeBlob(error)) ??
          'No se pudo armar la vista previa. Intenta nuevamente.',
      );
    },
  });
}

/**
 * Genera el acta desde el borrador o la regenera (con `id_acta` de un acta en
 * Generada o Requerido). Los rechazos con confirmación o faltantes los atiende
 * la pantalla, por eso el toast global va silenciado.
 */
export function useGenerarActa() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({
      payload,
      regenerar,
    }: {
      payload: IActaGenerarPayload;
      /** true cuando el acta ya está Generada o Requerido. */
      regenerar: boolean;
    }) => {
      const { data } =
        regenerar && payload.id_acta
          ? await apiClient.put<IActa>(
              API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA(payload.id_acta),
              payload,
            )
          : await apiClient.post<IActa>(
              API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_GENERAR,
              payload,
            );
      return data;
    },
    onSuccess: (acta, { regenerar }) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
      toastSuccess(
        regenerar
          ? 'El acta se regeneró con un corte nuevo.'
          : 'El acta se generó. Descarga el Word, imprímelo y sube el PDF firmado.',
      );
    },
  });
}

/** URL firmada del Word generado; se abre en otra pestaña. */
export function useDescargarDocumentoActa() {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.get<{ url: string } | string>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_DOCUMENTO(id),
      );
      return typeof data === 'string' ? data : data.url;
    },
    onSuccess: (url) => abrirEnPestana(url),
  });
}

/** URL firmada (en línea) del PDF firmado, para mostrarlo en el visor. */
export function useUrlFirmadaActa() {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.get<{ url: string } | string>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_FIRMADA(id),
      );
      return typeof data === 'string' ? data : data.url;
    },
  });
}

/** Sube el PDF firmado: el acta pasa a En revisión y reemplaza el anterior si lo había. */
export function useSubirFirmadaActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archivo }: { id: number; archivo: File }) => {
      const { data } = await apiClient.put<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_FIRMADA(id),
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (acta) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
      toastSuccess(
        'Acta firmada recibida; queda en revisión de oficina central.',
      );
    },
  });
}

/** Descarta el acta del consejo con motivo, mientras no esté aceptada. */
export function useDescartarActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data } = await apiClient.post<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_DESCARTAR(id),
        { motivo, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (acta) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
      toastSuccess('Acta descartada. El consejo ya puede generar una nueva.');
    },
  });
}

// ---------------------------------------------------------------- Oficina central

/** Resumen por consejo del tipo: todos los consejos aunque vayan en ceros, con sus actas por estatus. */
export function useActasResumen(tipoConsejo: 'D' | 'M' | null, enabled = true) {
  return useQuery<IActasResumen>({
    queryKey: MATERIAL_ELECTORAL_KEYS.actasResumen(tipoConsejo ?? 'NONE'),
    enabled: enabled && !!tipoConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IActasResumen>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS_RESUMEN(tipoConsejo!),
      );
      return { ...data, consejos: data?.consejos ?? [] };
    },
    staleTime: 30_000,
  });
}

/** Observaciones obligatorias de oficina central: el acta pasa a Requerido. */
export function useObservarActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      observaciones,
    }: {
      id: number;
      observaciones: string;
    }) => {
      const { data } = await apiClient.post<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_OBSERVACIONES(id),
        { observaciones, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (acta) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
      toastSuccess(
        'Observaciones enviadas. El acta queda como Requerido para el consejo.',
      );
    },
  });
}

/** Acepta el acta: queda inmutable y fija el corte del consejo. */
export function useAceptarActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      observaciones,
    }: {
      id: number;
      observaciones?: string;
    }) => {
      const { data } = await apiClient.post<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_ACEPTAR(id),
        { observaciones: observaciones || null, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (acta) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
      toastSuccess('Acta aceptada. Ya no admite cambios.');
    },
  });
}

/** Anula un acta aceptada con motivo; sus renglones quedan libres para la siguiente. */
export function useAnularActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data } = await apiClient.post<IActa>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTA_ANULAR(id),
        { motivo, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (acta) => {
      queryClient.setQueryData(MATERIAL_ELECTORAL_KEYS.acta(acta.id), acta);
      invalidarActas(queryClient);
      toastSuccess(
        'Acta anulada. El consejo puede generar una nueva que la sustituya.',
      );
    },
  });
}
