'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AUTH_KEYS } from '@/lib/query-keys';

// Estas pantallas muestran el resultado en su propia alerta, por eso silencian
// el toast global de errores del cliente de queries.
const SILENCIAR = { silenciarToast: true } as const;

/** Confirma la dirección de correo con el token que llegó por email. */
export function useVerificarCorreo() {
  return useMutation({
    meta: SILENCIAR,
    mutationFn: async (token: string) => {
      await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    },
  });
}

/** Solicita el enlace de recuperación de contraseña. */
export function useSolicitarRecuperacion() {
  return useMutation({
    meta: SILENCIAR,
    mutationFn: async (payload: { usuario: string }) => {
      await apiClient.post(API_ENDPOINTS.AUTH.RECUPERAR_CONTRASENIA, payload);
    },
  });
}

/** Comprueba que el token del enlace de restablecimiento siga siendo válido. */
export function useVerificarTokenReset(token: string | null) {
  return useQuery({
    queryKey: AUTH_KEYS.tokenReset(token),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
    gcTime: 0,
    meta: SILENCIAR,
    queryFn: async () => {
      await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_VERIFY, { token });
      return true as const;
    },
  });
}

/** Guarda la nueva contraseña usando el token del enlace. */
export function useRestablecerContrasenia() {
  return useMutation({
    meta: SILENCIAR,
    mutationFn: async (payload: {
      token: string | null;
      password: string;
      confirm_password: string;
    }) => {
      await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    },
  });
}
