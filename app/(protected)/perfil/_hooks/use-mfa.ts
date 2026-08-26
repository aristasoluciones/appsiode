'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AUTH_KEYS } from '@/lib/query-keys';
import type { IMfaEnrolamiento, IMfaEstado } from '@/types/auth';

// Los diálogos muestran el resultado en su propia alerta; se silencia el toast
// global de errores para no duplicar el aviso.
const SILENCIAR = { silenciarToast: true } as const;

/** Estado del segundo paso de la propia cuenta. */
export function useMfaEstado() {
  return useQuery({
    queryKey: AUTH_KEYS.mfaEstado(),
    meta: SILENCIAR,
    queryFn: async () => {
      const res = await apiClient.get<IMfaEstado>(API_ENDPOINTS.AUTH.MFA_ESTADO);
      return res.data;
    },
  });
}

/** Genera el enrolamiento: secreto y liga otpauth para dibujar el código QR. */
export function useMfaEnrolar() {
  return useMutation({
    meta: SILENCIAR,
    mutationFn: async () => {
      const res = await apiClient.post<IMfaEnrolamiento>(
        API_ENDPOINTS.AUTH.MFA_ENROLAR,
      );
      return res.data;
    },
  });
}

/** Confirma el enrolamiento con el primer código válido; entrega los códigos de respaldo. */
export function useMfaConfirmar() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SILENCIAR,
    mutationFn: async (codigo: string) => {
      const res = await apiClient.post<{ codigosRespaldo: string[] }>(
        API_ENDPOINTS.AUTH.MFA_CONFIRMAR,
        { codigo },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.mfaEstado() });
    },
  });
}

/** Desactiva el segundo paso presentando un código vigente. */
export function useMfaDesactivar() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SILENCIAR,
    mutationFn: async (codigo: string) => {
      await apiClient.post(API_ENDPOINTS.AUTH.MFA_DESACTIVAR, { codigo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.mfaEstado() });
    },
  });
}
