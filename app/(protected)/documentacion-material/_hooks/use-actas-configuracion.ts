'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IActaApartadoPayload,
  IActaConfiguracion,
  IActaMarcador,
  IActaPlantillaValidacion,
} from '@/types/material-electoral';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { MATERIAL_ELECTORAL_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** La plantilla viaja como multipart junto con la auditoría. */
function armarFormData(archivo: File) {
  const { dispositivo, mac } = getDataAuditoria();
  const form = new FormData();
  form.append('archivo', archivo);
  form.append('dispositivo', dispositivo);
  form.append('mac', mac);
  return form;
}

/**
 * Tras cualquier cambio de configuración se rehace la vigente y también las
 * actas: el resumen de oficina central y el listado del consejo avisan si ya
 * hay plantilla.
 */
function invalidarConfiguracion(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: MATERIAL_ELECTORAL_KEYS.actasConfiguracion(),
  });
  queryClient.invalidateQueries({ queryKey: MATERIAL_ELECTORAL_KEYS.actas() });
}

// ---------------------------------------------------------------- Consultas

/** Configuración vigente del acta del proceso de la sesión: plantilla, apartados y versiones. */
export function useActaConfiguracion(enabled = true) {
  return useQuery<IActaConfiguracion>({
    queryKey: MATERIAL_ELECTORAL_KEYS.actasConfiguracion(),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<IActaConfiguracion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS_CONFIGURACION,
      );
      return {
        ...data,
        apartados: data?.apartados ?? [],
        versiones: data?.versiones ?? [],
      };
    },
    staleTime: 30_000,
  });
}

/** Catálogo de marcadores que la plantilla puede traer; no cambia durante la sesión. */
export function useActaMarcadores(enabled = true) {
  return useQuery<IActaMarcador[]>({
    queryKey: MATERIAL_ELECTORAL_KEYS.actasMarcadores(),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<IActaMarcador[]>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS_CONFIGURACION_MARCADORES,
      );
      return Array.isArray(data) ? data : [];
    },
    staleTime: Infinity,
  });
}

// ---------------------------------------------------------------- Plantilla

/** URL firmada de la plantilla vigente o de una versión anterior; se abre en otra pestaña. */
export function useDescargarPlantillaActa() {
  return useMutation({
    mutationFn: async (version?: number) => {
      const { data } = await apiClient.get<{ url: string } | string>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS_CONFIGURACION_PLANTILLA(version),
      );
      return typeof data === 'string' ? data : data.url;
    },
    onSuccess: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
  });
}

/**
 * Revisa la plantilla sin guardarla. Un rechazo (400) trae también la lista de
 * marcadores faltantes en `data`, así que el error se atiende en pantalla y
 * el toast global va silenciado.
 */
export function useValidarPlantillaActa() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.post<IActaPlantillaValidacion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS_CONFIGURACION_PLANTILLA_VALIDAR,
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
  });
}

/** Sube la plantilla: la API la valida y crea la versión nueva; aplica a actas nuevas o regeneradas. */
export function useSubirPlantillaActa() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (archivo: File) => {
      const { data } = await apiClient.put<IActaConfiguracion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS_CONFIGURACION_PLANTILLA(),
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (configuracion) => {
      queryClient.setQueryData(
        MATERIAL_ELECTORAL_KEYS.actasConfiguracion(),
        configuracion,
      );
      invalidarConfiguracion(queryClient);
      toastSuccess(
        `Plantilla guardada como versión ${configuracion.plantilla_version}. Aplica a las actas que se generen o regeneren a partir de ahora.`,
      );
    },
  });
}

// ---------------------------------------------------------------- Apartados

/** Reemplaza la lista de apartados de fotografías y crea la versión nueva. */
export function useGuardarApartadosActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apartados: IActaApartadoPayload[]) => {
      const { data } = await apiClient.put<IActaConfiguracion>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.ACTAS_CONFIGURACION_APARTADOS,
        { apartados, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (configuracion) => {
      queryClient.setQueryData(
        MATERIAL_ELECTORAL_KEYS.actasConfiguracion(),
        configuracion,
      );
      invalidarConfiguracion(queryClient);
      toastSuccess(
        'Apartados guardados. Aplican a las actas que se generen o regeneren a partir de ahora.',
      );
    },
  });
}
