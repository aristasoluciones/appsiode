'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IMecanismo } from '@/types/mecanismos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { armarFormData, MULTIPART } from '@/lib/archivos';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';
import { guardarMecanismoEnCache } from './use-mecanismos';

/**
 * URL firmada del PDF de la cédula del mecanismo, para el panel lateral. Solo
 * se pide con el panel abierto y cuando el mecanismo tiene cédula; la firma
 * caduca, por eso se conserva poco tiempo.
 */
export function useCedulaArchivo(id: number | null, habilitado = true) {
  // El API responde la URL firmada como cadena (en línea, lista para el iframe).
  return useQuery<string>({
    enabled: habilitado && !!id,
    queryKey: MECANISMOS_KEYS.cedulaArchivo(id ?? 0),
    queryFn: async () => {
      const { data } = await apiClient.get<string>(
        API_ENDPOINTS.MECANISMOS.CEDULA(id!),
      );
      return data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Oficina central carga o reemplaza el PDF de la cédula; devuelve el detalle del mecanismo. */
export function useCargarCedula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archivo }: { id: number; archivo: File }) => {
      const { data } = await apiClient.put<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CEDULA(id),
        armarFormData(archivo),
        MULTIPART,
      );
      return data;
    },
    onSuccess: (mecanismo, { id }) => {
      guardarMecanismoEnCache(queryClient, mecanismo);
      // La URL firmada apunta al archivo anterior: se retira para pedir la nueva.
      queryClient.removeQueries({
        queryKey: MECANISMOS_KEYS.cedulaArchivo(id),
      });
      toastSuccess('Cédula guardada.');
    },
  });
}
