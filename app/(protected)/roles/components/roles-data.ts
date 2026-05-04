'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { toastSuccess } from '@/lib/toast';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IRol {
  id: number;
  rol: string;
  descripcion?: string;
}

export interface ICreateRolInput {
  rol: string;
  descripcion?: string;
}

// Módulo del catálogo → data.modulos[]
export interface IModuloCatalogo {
  clave: string;
  titulo: string;
}

// Acción del catálogo completo → data.acciones[]
export interface IAccionCatalogo {
  id: number;
  clave: string;
  titulo: string;
  modulo: string;
  icono: string | null;
  orden: number;
  es_menu: boolean;
}

// Estructura completa del response de /Roles/{idRol}/permisos (ya desenvuelta por interceptor)
export interface IPermisosResponse {
  permisos: number[];          // IDs de acciones activas para el rol
  modulos: IModuloCatalogo[];
  acciones: IAccionCatalogo[];
}

// ── Query Keys ────────────────────────────────────────────────────────────────

const QK_ROLES    = 'roles'         as const;
const QK_PERMISOS = 'roles-permisos' as const;

// ── Queries ───────────────────────────────────────────────────────────────────

export function useRolesData() {
  return useQuery({
    queryKey: [QK_ROLES],
    queryFn: async () => {
      const { data } = await apiClient.get<IRol[]>(API_ENDPOINTS.ROLES.LIST);
      return data;
    },
  });
}

export function usePermisosByRol(idRol: number) {
  return useQuery({
    queryKey: [QK_PERMISOS, idRol],
    queryFn: async () => {
      const { data } = await apiClient.get<IPermisosResponse>(
        API_ENDPOINTS.ROLES.PERMISOS(idRol),
      );
      return data;
    },
    enabled: idRol >= 0, // No hacer la consulta si no hay un rol seleccionado
    staleTime: 30_000, // 30 s — evita refetch al reabrir el dialog rápidamente
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ICreateRolInput) => {
      const { data } = await apiClient.post<IRol>(API_ENDPOINTS.ROLES.CREATE, {
        ...payload,
        ...getDataAuditoria(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_ROLES] });
      toastSuccess('Rol creado correctamente.');
    },
  });
}

export function useUpdateRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ idRol, data }: { idRol: number; data: ICreateRolInput }) => {
      const { data: updated } = await apiClient.put<IRol>(
        API_ENDPOINTS.ROLES.UPDATE(idRol),
        { ...data, ...getDataAuditoria() },
      );
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_ROLES] });
      toastSuccess('Rol actualizado correctamente.');
    },
  });
}

export function useDeleteRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idRol: number) => {
      await apiClient.delete(API_ENDPOINTS.ROLES.DELETE(idRol), {
        data: getDataAuditoria(),
      });
      return idRol;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_ROLES] });
      toastSuccess('Rol eliminado correctamente.');
    },
  });
}

export function useTogglePermiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ idRol, idAccion }: { idRol: number; idAccion: number }) => {
      await apiClient.put(API_ENDPOINTS.ROLES.TOGGLE_PERMISO(idRol, idAccion));
      return { idRol, idAccion };
    },

    // Optimistic update — el switch cambia al instante sin esperar al servidor
    onMutate: async ({ idRol, idAccion }) => {
      await queryClient.cancelQueries({ queryKey: [QK_PERMISOS, idRol] });

      const previous = queryClient.getQueryData<IPermisosResponse>([QK_PERMISOS, idRol]);

      queryClient.setQueryData<IPermisosResponse>([QK_PERMISOS, idRol], (old) => {
        if (!old) return old;
        const tiene = old.permisos?.includes(idAccion);
        return {
          ...old,
          permisos: tiene
            ? old.permisos?.filter((p) => p !== idAccion)
            : [...(old.permisos ?? []), idAccion],
        };
      });

      return { previous };
    },

    // Revertir si el servidor falla
    onError: (_error, { idRol }, context: { previous: unknown } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData([QK_PERMISOS, idRol], context.previous);
      }
    },

    // Sincronizar con el servidor al terminar (éxito o error)
    onSettled: (_data, _error, { idRol }) => {
      queryClient.invalidateQueries({ queryKey: [QK_PERMISOS, idRol] });
    },
  });
}
