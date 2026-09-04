'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ILayoutImportacion,
  ILayoutImportacionRevertirPayload,
  ILayoutResultado,
  ILayoutReversion,
  ILayoutValidacion,
  ITipoDocumentacion,
} from '@/types/material-electoral';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { MATERIAL_ELECTORAL_KEYS } from '@/lib/query-keys';
import { toastError, toastSuccess } from '@/lib/toast';

const TIPO_EXCEL =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Dispara la descarga de un archivo ya en memoria. */
function descargar(contenido: Blob, nombreArchivo: string) {
  const url = window.URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  window.URL.revokeObjectURL(url);
}

/** El archivo se envía como multipart junto con el tipo de consejo y la auditoría. */
function armarFormData(archivo: File, tipoConsejo: 'D' | 'M'): FormData {
  const { dispositivo, mac } = getDataAuditoria();
  const form = new FormData();
  form.append('archivo', archivo);
  form.append('tipoConsejo', tipoConsejo);
  form.append('dispositivo', dispositivo);
  form.append('mac', mac);
  return form;
}

/**
 * Catálogo de tipos de documentación y material vigente, para orientar la captura.
 * Se pide solo cuando la ventana que lo muestra está abierta.
 */
export function useTiposDocumentacion(habilitado = true) {
  return useQuery({
    enabled: habilitado,
    queryKey: MATERIAL_ELECTORAL_KEYS.layoutTipos(),
    queryFn: async () => {
      const { data } = await apiClient.get<ITipoDocumentacion[]>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.LAYOUT_TIPOS(),
      );
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Descarga el formato de captura del tipo de consejo, con los consejos, las
 * elecciones y los tipos vigentes como listas. El error se avisa aquí porque el
 * cuerpo llega como binario y el toast global no puede leer su mensaje.
 */
export function useDescargarFormatoLayout() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (tipoConsejo: 'D' | 'M') => {
      const response = await apiClient.get(
        API_ENDPOINTS.MATERIAL_ELECTORAL.LAYOUT_FORMATO(tipoConsejo),
        { responseType: 'blob' },
      );
      return { contenido: response.data as Blob, tipoConsejo };
    },
    onSuccess: ({ contenido, tipoConsejo }) => {
      descargar(
        new Blob([contenido], { type: TIPO_EXCEL }),
        tipoConsejo === 'D'
          ? 'layout-documentacion-material-distritales.xlsx'
          : 'layout-documentacion-material-municipales.xlsx',
      );
    },
    onError: () =>
      toastError('No se pudo descargar el formato. Intenta nuevamente.'),
  });
}

/**
 * Revisa el archivo completo y devuelve la vista previa. No carga nada.
 * La pantalla muestra el error en su propia alerta.
 */
export function useValidarLayout() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({
      archivo,
      tipoConsejo,
    }: {
      archivo: File;
      tipoConsejo: 'D' | 'M';
    }) => {
      const { data } = await apiClient.post<ILayoutValidacion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.LAYOUT_VALIDAR,
        armarFormData(archivo, tipoConsejo),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
  });
}

/** Carga los renglones del layout. Si una fila tiene observaciones no se carga ninguna. */
export function useCargarLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({
      archivo,
      tipoConsejo,
    }: {
      archivo: File;
      tipoConsejo: 'D' | 'M';
    }) => {
      const { data } = await apiClient.post<ILayoutResultado>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.LAYOUT_CARGAR,
        armarFormData(archivo, tipoConsejo),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      // La carga cambia los renglones de los consejos: se rehacen el tablero de
      // avance, las listas de comprobación ya cargadas y el historial.
      invalidarTrasCambioDeLayout(queryClient);
    },
  });
}

/** Una carga o una reversión tocan lo mismo: avance, comprobaciones e historial. */
function invalidarTrasCambioDeLayout(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: MATERIAL_ELECTORAL_KEYS.avance(),
  });
  queryClient.invalidateQueries({
    queryKey: MATERIAL_ELECTORAL_KEYS.comprobaciones(),
  });
  queryClient.invalidateQueries({
    queryKey: MATERIAL_ELECTORAL_KEYS.layoutImportaciones(),
  });
}

/**
 * Historial de importaciones del proceso y del tipo de consejo, de la más
 * reciente a la más antigua. Se pide solo con el apartado abierto; el error se
 * muestra en la propia ventana.
 */
export function useImportacionesLayout(
  tipoConsejo: 'D' | 'M',
  habilitado = true,
) {
  return useQuery({
    enabled: habilitado,
    queryKey: MATERIAL_ELECTORAL_KEYS.layoutImportacionesTipo(tipoConsejo),
    queryFn: async () => {
      const { data } = await apiClient.get<ILayoutImportacion[]>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.LAYOUT_IMPORTACIONES(tipoConsejo),
      );
      return data ?? [];
    },
    meta: { silenciarToast: true },
  });
}

/**
 * Revierte la importación aplicada más reciente: borra los documentos que creó
 * y regresa a sus valores anteriores los que actualizó. Si el API la rechaza
 * (por ejemplo, porque ya hay comprobaciones capturadas) la ventana muestra su
 * mensaje tal cual; por eso aquí se silencia el toast de error.
 */
export function useRevertirImportacion() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async ({ id, motivo }: ILayoutImportacionRevertirPayload) => {
      const { data } = await apiClient.post<ILayoutReversion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.LAYOUT_IMPORTACION_REVERTIR(id),
        { motivo: motivo.trim(), ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (data) => {
      toastSuccess(
        `Importación revertida: ${data.eliminados.toLocaleString('es-MX')} documentos eliminados y ${data.restaurados.toLocaleString('es-MX')} regresados a sus valores anteriores.`,
      );
      invalidarTrasCambioDeLayout(queryClient);
    },
  });
}
