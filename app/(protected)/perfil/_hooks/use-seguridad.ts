'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AUTH_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';
import type { IDispositivoConfianza, ISesionActiva } from '@/types/auth';

// Las secciones muestran el fallo de la consulta en su propia alerta con botón
// de reintentar; se silencia el toast global para no duplicar el aviso. Los
// errores de las mutaciones sí los reporta el toast global del QueryProvider.
const SILENCIAR = { silenciarToast: true } as const;

/** Sesiones abiertas de la propia cuenta, con la actual marcada. */
export function useSesionesActivas() {
  return useQuery({
    queryKey: AUTH_KEYS.sesiones(),
    meta: SILENCIAR,
    queryFn: async () => {
      const res = await apiClient.get<ISesionActiva[]>(
        API_ENDPOINTS.AUTH.SESIONES,
      );
      return res.data ?? [];
    },
  });
}

/**
 * Cierra una sesión concreta. Si es la actual, la API borra además las cookies:
 * quien la llama debe encadenar el cierre de sesión normal.
 */
export function useCerrarSesion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idSesion }: { idSesion: string; actual: boolean }) => {
      await apiClient.delete(API_ENDPOINTS.AUTH.SESION(idSesion));
    },
    onSuccess: (_data, { actual }) => {
      // Al cerrar la propia sesión ya no hay con qué volver a consultar la
      // lista: el llamador encadena el cierre de sesión del navegador.
      if (actual) return;
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.sesiones() });
      toastSuccess('Sesión cerrada.');
    },
  });
}

/** Cierra todas las sesiones de la cuenta salvo la actual. */
export function useCerrarOtrasSesiones() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(API_ENDPOINTS.AUTH.SESIONES);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.sesiones() });
      toastSuccess('Se cerraron las demás sesiones.');
    },
  });
}

/** Equipos a los que se les recordó el segundo paso, con el actual marcado. */
export function useDispositivosConfianza() {
  return useQuery({
    queryKey: AUTH_KEYS.mfaDispositivos(),
    meta: SILENCIAR,
    queryFn: async () => {
      const res = await apiClient.get<IDispositivoConfianza[]>(
        API_ENDPOINTS.AUTH.MFA_DISPOSITIVOS,
      );
      return res.data ?? [];
    },
  });
}

/** Retira la confianza a un equipo: volverá a pedirle el código al iniciar sesión. */
export function useRetirarDispositivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idDispositivo: string) => {
      await apiClient.delete(API_ENDPOINTS.AUTH.MFA_DISPOSITIVO(idDispositivo));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.mfaDispositivos() });
      toastSuccess('Se retiró la confianza al equipo.');
    },
  });
}

/** Retira la confianza a todos los equipos recordados de la cuenta. */
export function useRetirarDispositivos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(API_ENDPOINTS.AUTH.MFA_DISPOSITIVOS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.mfaDispositivos() });
      toastSuccess('Se retiró la confianza a todos los equipos.');
    },
  });
}
