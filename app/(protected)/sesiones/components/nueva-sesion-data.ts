'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toastSuccess } from '@/lib/toast';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ICatalogosData, ICrearSesionInput } from '@/types/sesiones';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const CATALOGOS_SESIONES_KEY = ['catalogos', 'sesiones'] as const;

// ─── Catalog hook ─────────────────────────────────────────────────────────────

export function useCatalogosSesiones() {
  return useQuery<ICatalogosData>({
    queryKey: CATALOGOS_SESIONES_KEY,
    queryFn: async () => {
      const res = await apiClient.get<ICatalogosData>(API_ENDPOINTS.CATALOGOS.SESIONES);
      return res.data;
    },
    staleTime: 10 * 60 * 1000, // 10 min — catálogos cambian poco
    gcTime: 30 * 60 * 1000,
  });
}

// ─── Create mutation ──────────────────────────────────────────────────────────

export function useCrearSesion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ICrearSesionInput) => {
      const res = await apiClient.post(API_ENDPOINTS.SESIONES.CREATE, data);
      return res.data;
    },
    onSuccess: () => {
      toastSuccess('Sesión creada correctamente.');
      // Invalidar indicadores para reflejar la nueva sesión
      queryClient.invalidateQueries({ queryKey: ['sesiones', 'indicadores'] });
      queryClient.invalidateQueries({ queryKey: ['sesiones', 'opciones'] });
    },
  });
}
