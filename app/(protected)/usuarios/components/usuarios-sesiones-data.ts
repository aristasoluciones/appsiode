'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { USUARIOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';
import type { ISesionActiva } from '@/types/auth';

// El panel muestra el fallo de la consulta en su propia alerta con botón de
// reintentar; los errores de las mutaciones los reporta el toast global.
const SILENCIAR = { silenciarToast: true } as const;

/** Sesiones abiertas de la cuenta indicada (requiere el permiso de consulta). */
export function useUsuarioSesiones(idUsuario: number | null, enabled: boolean) {
  return useQuery({
    queryKey: USUARIOS_KEYS.sesiones(idUsuario ?? 0),
    enabled: enabled && idUsuario != null,
    meta: SILENCIAR,
    queryFn: async () => {
      const { data } = await apiClient.get<ISesionActiva[]>(
        API_ENDPOINTS.USUARIOS.SESIONES(idUsuario as number),
      );
      return Array.isArray(data) ? data : [];
    },
  });
}

/** Cierra una sesión concreta de la cuenta: ese equipo pierde el acceso al instante. */
export function useCerrarSesionUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      idUsuario,
      idSesion,
    }: {
      idUsuario: number;
      idSesion: string;
    }) => {
      await apiClient.delete(API_ENDPOINTS.USUARIOS.SESION(idUsuario, idSesion));
      return { idUsuario };
    },
    onSuccess: ({ idUsuario }) => {
      queryClient.invalidateQueries({
        queryKey: USUARIOS_KEYS.sesiones(idUsuario),
      });
      // El cierre deja evento en el historial de la cuenta.
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.historial() });
      toastSuccess('Sesión cerrada.');
    },
  });
}

/** Cierra todas las sesiones de la cuenta, sin excepciones. */
export function useCerrarSesionesUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idUsuario: number) => {
      await apiClient.delete(API_ENDPOINTS.USUARIOS.SESIONES(idUsuario));
      return idUsuario;
    },
    onSuccess: (idUsuario) => {
      queryClient.invalidateQueries({
        queryKey: USUARIOS_KEYS.sesiones(idUsuario),
      });
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.historial() });
      toastSuccess('Se cerraron todas las sesiones de la cuenta.');
    },
  });
}
