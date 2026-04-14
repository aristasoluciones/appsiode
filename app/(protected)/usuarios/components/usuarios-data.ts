'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IUsuario {
  id: number;
  usuario: string;       // correo electrónico / login
  nombre: string;
  paterno: string;
  materno: string;
  celular: string | null;
  status: string;
  id_rol: number;
  consejo_tipo: string;
  consejo_clave: number;
  rol?: string;
}

export interface IRolOpcion {
  id: number;
  rol: string;
}

export interface IConsejo {
  clave: number;
  tipo: 'D' | 'M' | string;
  consejo: string;
  id_proceso: number;
}

// Estructura raw del response (después de que el interceptor desenvuelve el outer envelope)
interface IFormDataRaw {
  usuarios: {
    status: string;
    message: string;
    data: { activos: IUsuario[] };
  };
  roles: {
    status: string;
    message: string;
    data: IRolOpcion[];
  };
  consejos: {
    status: string;
    message: string;
    data: IConsejo[];
  };
}

// Datos normalizados que devuelve el hook
export interface IUsuariosFormData {
  usuarios: IUsuario[];
  roles: IRolOpcion[];
  consejos: IConsejo[];
}

export interface ICreateUsuarioInput {
  id_rol: number;
  usuario: string;
  celular: string;
  paterno: string;
  materno: string;
  nombre: string;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

const QK_USUARIOS_FORM = 'usuarios-form' as const;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Carga inicial: /Usuarios/form devuelve usuarios + roles + consejos
 * en sub-envelopes anidados. Este hook los normaliza en arrays planos.
 */
export function useUsuariosFormData() {
  return useQuery({
    queryKey: [QK_USUARIOS_FORM],
    queryFn: async () => {
      const { data } = await apiClient.get<IFormDataRaw>(API_ENDPOINTS.USUARIOS.FORM);
      const result: IUsuariosFormData = {
        usuarios: data.usuarios?.data?.activos ?? [],
        roles: data.roles?.data ?? [],
        consejos: data.consejos?.data ?? [],
      };
      return result;
    },
    staleTime: 2 * 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ICreateUsuarioInput) => {
      const { data } = await apiClient.post<IUsuario>(API_ENDPOINTS.USUARIOS.CREATE, {
        ...payload,
        ...getDataAuditoria(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_USUARIOS_FORM] });
      toast.success('Usuario creado correctamente.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Error al crear el usuario.');
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      idUsuario,
      data,
    }: {
      idUsuario: number;
      data: ICreateUsuarioInput;
    }) => {
      const { data: updated } = await apiClient.put<IUsuario>(
        API_ENDPOINTS.USUARIOS.UPDATE(idUsuario),
        { ...data, ...getDataAuditoria() },
      );
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_USUARIOS_FORM] });
      toast.success('Usuario actualizado correctamente.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Error al actualizar el usuario.');
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idUsuario: number) => {
      await apiClient.delete(API_ENDPOINTS.USUARIOS.DELETE(idUsuario), {
        data: getDataAuditoria(),
      });
      return idUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK_USUARIOS_FORM] });
      toast.success('Usuario eliminado correctamente.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Error al eliminar el usuario.');
    },
  });
}
