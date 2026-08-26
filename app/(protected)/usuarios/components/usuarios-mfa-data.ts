'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { USUARIOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Estado del segundo paso de una cuenta, tal como lo entrega /Usuarios/mfa. */
export interface IUsuarioMfa {
  id_usuario: number;
  /** Tiene un enrolamiento generado (confirmado o no). */
  enrolado: boolean;
  /** El enrolamiento está confirmado: el segundo paso opera con la app. */
  confirmado: boolean;
  /** La administración exige el segundo paso a esta cuenta. */
  exigido: boolean;
  fecha_confirmacion: string | null;
  fecha_ultimo_uso: string | null;
  respaldo_restantes: number;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Estado del segundo paso de todas las cuentas activas (pantalla de Usuarios). */
export function useUsuariosMfa(enabled: boolean) {
  return useQuery({
    queryKey: USUARIOS_KEYS.mfa(),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<IUsuarioMfa[]>(
        API_ENDPOINTS.USUARIOS.MFA_ESTADOS,
      );
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Resetea el enrolamiento: el usuario vuelve a enrolar en su siguiente sesión. */
export function useResetearMfa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idUsuario: number) => {
      await apiClient.post(
        API_ENDPOINTS.USUARIOS.MFA_RESETEAR(idUsuario),
        getDataAuditoria(),
      );
      return idUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.mfa() });
      toastSuccess(
        'Enrolamiento reseteado. El usuario podrá volver a enrolar su aplicación.',
      );
    },
    // Errores: los avisa el toast global del cliente de queries.
  });
}

/** Exige o libera el segundo paso para la cuenta indicada. */
export function useExigenciaMfa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      idUsuario,
      exigido,
    }: {
      idUsuario: number;
      exigido: boolean;
    }) => {
      await apiClient.put(API_ENDPOINTS.USUARIOS.MFA_EXIGENCIA(idUsuario), {
        exigido,
        ...getDataAuditoria(),
      });
      return { idUsuario, exigido };
    },
    onSuccess: ({ exigido }) => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.mfa() });
      toastSuccess(
        exigido
          ? 'El segundo paso quedó exigido para la cuenta.'
          : 'El segundo paso dejó de ser obligatorio para la cuenta.',
      );
    },
    // Errores: los avisa el toast global del cliente de queries.
  });
}
