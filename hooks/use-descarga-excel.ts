'use client';

import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import {
  descargar,
  mensajeDeBlob,
  nombreDeRespuesta,
  TIPO_EXCEL,
} from '@/lib/archivos';
import { toastError } from '@/lib/toast';

/**
 * Descarga un Excel del API (formatos y reportes). El nombre lo propone el API
 * en `Content-Disposition`; el error se lee del blob porque el toast global no
 * puede abrir una respuesta binaria.
 */
export function useDescargaExcel<TVariables>(
  ruta: (variables: TVariables) => string,
  nombreRespaldo: (variables: TVariables) => string,
  mensajeError = 'No se pudo descargar el archivo. Intenta nuevamente.',
) {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.get(ruta(variables), {
        responseType: 'blob',
      });
      return {
        contenido: response.data as Blob,
        nombre: nombreDeRespuesta(
          response.headers as Record<string, unknown>,
          nombreRespaldo(variables),
        ),
      };
    },
    onSuccess: ({ contenido, nombre }) =>
      descargar(new Blob([contenido], { type: TIPO_EXCEL }), nombre),
    onError: async (error) =>
      toastError((await mensajeDeBlob(error)) ?? mensajeError),
  });
}
