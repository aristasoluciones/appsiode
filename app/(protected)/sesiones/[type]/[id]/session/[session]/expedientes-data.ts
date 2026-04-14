'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toastSuccess, toastError } from '@/lib/toast';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ITipoDocumento {
  id: number;
  tipo: string;
}

export interface IExpediente {
  id: number;
  id_sesion: number;
  no_doc: string;
  tipo: string;
  id_tipo: number;
  descripcion: string;
  fecha: string | null;
  url: string | null;
  uuid_blob: string | null;
}

export interface ISubirExpedienteInput {
  id_tipo: number;
  no_doc: string;
  fecha: string;
  descripcion: string;
  archivo: File;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

const QK_TIPOS_DOC = 'catalogos-tipos-documentos' as const;
const QK_EXPEDIENTES = 'sesion-expedientes' as const;

// ─── Catálogo tipos de documento ─────────────────────────────────────────────

export function useTiposDocumentos() {
  return useQuery({
    queryKey: [QK_TIPOS_DOC],
    queryFn: async (): Promise<ITipoDocumento[]> => {
      const { data } = await apiClient.get<{ tipos_documentos: ITipoDocumento[] }>(
        API_ENDPOINTS.CATALOGOS.LIST('TIPOS_DOCUMENTOS'),
      );
      return Array.isArray(data?.tipos_documentos) ? data.tipos_documentos : [];
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Expedientes de sesión ────────────────────────────────────────────────────

export function useExpedientesSesion(idSesion: string) {
  return useQuery({
    queryKey: [QK_EXPEDIENTES, idSesion],
    queryFn: async (): Promise<IExpediente[]> => {
      const { data } = await apiClient.get<IExpediente[]>(
        API_ENDPOINTS.SESIONES.EXPEDIENTES(idSesion),
      );
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

// ─── Eliminar expediente ──────────────────────────────────────────────────────

export function useEliminarExpediente(idSesion: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idExpediente: number) =>
      apiClient.delete(API_ENDPOINTS.SESIONES.ELIMINAR_EXPEDIENTE(idSesion, idExpediente)),
    onSuccess: () => {
      toastSuccess('Documento eliminado correctamente.');
      queryClient.invalidateQueries({ queryKey: [QK_EXPEDIENTES, idSesion] });
    },
    onError: () => {
      toastError('No se pudo eliminar el documento. Intenta nuevamente.');
    },
  });
}

// ─── Visualizar expediente ────────────────────────────────────────────────────

export function useVerExpediente(idSesion: string) {
  return useMutation({
    mutationFn: async ({ idExpediente, uuid_blob }: { idExpediente: number; uuid_blob: string }) => {
      const { data } = await apiClient.post<{ url: string }>(
        API_ENDPOINTS.SESIONES.VER_EXPEDIENTE(idSesion, idExpediente),
        { uuid_blob },
      );
      return data
    },
    onError: () => {
      toastError('No se pudo obtener el archivo. Intenta nuevamente.');
    },
  });
}

// ─── Subir expediente ─────────────────────────────────────────────────────────

export function useSubirExpediente(idSesion: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ISubirExpedienteInput) => {
      const formData = new FormData();
      formData.append('id_tipo', String(payload.id_tipo));
      formData.append('no_doc', payload.no_doc);
      formData.append('fecha', payload.fecha);
      formData.append('descripcion', payload.descripcion);
      formData.append('archivo', payload.archivo);
      return apiClient.post(
        API_ENDPOINTS.SESIONES.EXPEDIENTES(idSesion),
        formData,
        { headers: { 'Content-Type': undefined } },
      );
    },
    onSuccess: () => {
      toastSuccess('Documento subido correctamente.');
      queryClient.invalidateQueries({ queryKey: [QK_EXPEDIENTES, idSesion] });
    },
    onError: () => {
      toastError('No se pudo subir el documento. Intenta nuevamente.');
    },
  });
}
