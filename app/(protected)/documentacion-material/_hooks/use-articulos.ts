'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IArticulo,
  IArticuloImagenUrls,
  IArticuloPayload,
  IArticulosFotografiasResultado,
  IArticulosFotografiasValidacion,
  IArticulosImportacionResultado,
  IArticulosValidacion,
} from '@/types/material-electoral';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { MATERIAL_ELECTORAL_KEYS } from '@/lib/query-keys';
import { toastError, toastSuccess } from '@/lib/toast';

const TIPO_EXCEL =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** Dispara la descarga de un archivo ya en memoria. */
function descargar(contenido: Blob, nombreArchivo: string) {
  const url = window.URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  window.URL.revokeObjectURL(url);
}

/** El archivo se envía como multipart junto con la auditoría. */
function armarFormData(archivo: File): FormData {
  const { dispositivo, mac } = getDataAuditoria();
  const form = new FormData();
  form.append('archivo', archivo);
  form.append('dispositivo', dispositivo);
  form.append('mac', mac);
  return form;
}

/** Cualquier escritura del catálogo rehace la lista, con y sin inactivos. */
function invalidarCatalogo(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: MATERIAL_ELECTORAL_KEYS.articulos(),
  });
}

// ---------------------------------------------------------------- Consulta

/**
 * Catálogo de artículos; con `incluirInactivos` vienen también los inactivos.
 * `habilitado` permite pedirlo solo cuando la pantalla que lo usa está a la vista.
 */
export function useArticulos(incluirInactivos: boolean, habilitado = true) {
  return useQuery({
    enabled: habilitado,
    queryKey: MATERIAL_ELECTORAL_KEYS.articulosLista(incluirInactivos),
    queryFn: async () => {
      const { data } = await apiClient.get<IArticulo[]>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULOS(incluirInactivos),
      );
      return data ?? [];
    },
    meta: { silenciarToast: true },
  });
}

/**
 * URL firmadas de la fotografía de un artículo. Se piden solo cuando el
 * artículo tiene fotografía; la llave lleva la versión, así que al reemplazarla
 * se vuelve a pedir sola. Las URL duran 30 minutos: se conservan menos tiempo.
 */
export function useArticuloImagen(
  id: number,
  version: number,
  habilitado: boolean,
) {
  return useQuery({
    enabled: habilitado,
    queryKey: MATERIAL_ELECTORAL_KEYS.articuloImagen(id, version),
    queryFn: async () => {
      const { data } = await apiClient.get<IArticuloImagenUrls>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULO_IMAGEN(id),
      );
      return data;
    },
    staleTime: 20 * 60 * 1000,
    gcTime: 25 * 60 * 1000,
    retry: false,
    meta: { silenciarToast: true },
  });
}

// ---------------------------------------------------------------- Alta, edición y estatus

export function useRegistrarArticulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IArticuloPayload) => {
      const { data } = await apiClient.post<IArticulo>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULOS_CREAR,
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: () => invalidarCatalogo(queryClient),
  });
}

export function useEditarArticulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: IArticuloPayload & { id: number }) => {
      const { data } = await apiClient.put<IArticulo>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULO(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: () => invalidarCatalogo(queryClient),
  });
}

/** Activa o inactiva el artículo. El catálogo no elimina: las cargas anteriores conservan su referencia. */
export function useCambiarEstatusArticulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      const { data } = await apiClient.patch<IArticulo>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULO_ESTATUS(id),
        { activo, ...getDataAuditoria() },
      );
      return { articulo: data, activo };
    },
    onSuccess: ({ activo }) => {
      toastSuccess(activo ? 'Artículo activado.' : 'Artículo inactivado.');
      invalidarCatalogo(queryClient);
    },
  });
}

// ---------------------------------------------------------------- Fotografía individual

/** Sube o reemplaza la fotografía; el API la revisa, la reduce y genera la miniatura. */
export function useSubirFotografiaArticulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archivo }: { id: number; archivo: File }) => {
      const { data } = await apiClient.put<IArticulo>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULO_IMAGEN(id),
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => invalidarCatalogo(queryClient),
  });
}

export function useEliminarFotografiaArticulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete<IArticulo>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULO_IMAGEN(id),
        { data: getDataAuditoria() },
      );
      return data;
    },
    onSuccess: () => invalidarCatalogo(queryClient),
  });
}

// ---------------------------------------------------------------- Importación del catálogo

/**
 * Descarga el formato con los artículos que ya existen. El error se avisa aquí
 * porque el cuerpo llega como binario y el toast global no puede leer su mensaje.
 */
export function useDescargarFormatoArticulos() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async () => {
      const response = await apiClient.get(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULOS_FORMATO,
        { responseType: 'blob' },
      );
      return response.data as Blob;
    },
    onSuccess: (contenido) =>
      descargar(
        new Blob([contenido], { type: TIPO_EXCEL }),
        'catalogo-articulos-documentacion-material.xlsx',
      ),
    onError: () =>
      toastError('No se pudo descargar el formato. Intenta nuevamente.'),
  });
}

/** Revisa el archivo completo y devuelve la vista previa. No guarda nada; la ventana muestra el error. */
export function useValidarImportacionArticulos() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IArticulosValidacion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULOS_IMPORTAR_VALIDAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Importa el catálogo. Si un renglón tiene observaciones no se importa ninguno. */
export function useImportarArticulos() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IArticulosImportacionResultado>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULOS_IMPORTAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => invalidarCatalogo(queryClient),
  });
}

// ---------------------------------------------------------------- Importación de fotografías

/** Revisa el zip y devuelve qué archivos se aplicarían. No guarda nada. */
export function useValidarFotografiasArticulos() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IArticulosFotografiasValidacion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULOS_FOTOGRAFIAS_VALIDAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Aplica las fotografías del zip. Las que fallan se informan por nombre sin detener el resto. */
export function useImportarFotografiasArticulos() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IArticulosFotografiasResultado>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ARTICULOS_FOTOGRAFIAS_IMPORTAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: () => {
      invalidarCatalogo(queryClient);
      // Las miniaturas se piden por versión; al cambiar la versión en la lista se vuelven a pedir solas.
    },
  });
}
