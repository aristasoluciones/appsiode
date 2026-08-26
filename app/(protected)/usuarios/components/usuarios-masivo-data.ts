'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { USUARIOS_KEYS } from '@/lib/query-keys';
import { toastError } from '@/lib/toast';
import type {
  IMasivoAcuse,
  IMasivoResultado,
  IMasivoValidacion,
} from '@/types/usuarios-masivo';

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

/** Convierte el acuse que llega en base64 a un archivo descargable. */
export function descargarAcuse(acuse: IMasivoAcuse) {
  const binario = window.atob(acuse.contenido_base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  descargar(
    new Blob([bytes], { type: TIPO_EXCEL }),
    acuse.nombre_archivo || 'acuse-alta-masiva-cuentas.xlsx',
  );
}

/** El archivo se envía como multipart junto con los datos de auditoría. */
function armarFormData(archivo: File): FormData {
  const { dispositivo, mac } = getDataAuditoria();
  const form = new FormData();
  form.append('archivo', archivo);
  form.append('dispositivo', dispositivo);
  form.append('mac', mac);
  return form;
}

/**
 * Descarga el formato de captura que genera el API, con sus listas de tipo de
 * consejo, consejo y rol. El error se avisa aquí porque el cuerpo llega como
 * binario y el toast global no puede leer su mensaje.
 */
export function useDescargarLayoutMasivo() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.USUARIOS.MASIVO_LAYOUT, {
        responseType: 'blob',
      });
      return response.data as Blob;
    },
    onSuccess: (contenido) => {
      descargar(
        new Blob([contenido], { type: TIPO_EXCEL }),
        'layout-alta-masiva-cuentas.xlsx',
      );
    },
    onError: () =>
      toastError('No se pudo descargar el formato. Intenta nuevamente.'),
  });
}

/**
 * Revisa el archivo y devuelve la vista previa fila por fila. No crea nada.
 * La pantalla muestra el error en su propia alerta.
 */
export function useValidarCargaMasiva() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IMasivoValidacion>(
        API_ENDPOINTS.USUARIOS.MASIVO_VALIDAR,
        armarFormData(archivo),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
  });
}

/** Crea las cuentas válidas del archivo y devuelve el acuse descargable. */
export function useProcesarCargaMasiva() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IMasivoResultado>(
        API_ENDPOINTS.USUARIOS.MASIVO_CREAR,
        armarFormData(archivo),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.form() });
    },
  });
}
