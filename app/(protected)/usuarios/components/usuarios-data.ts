'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { toastSuccess, toastError } from '@/lib/toast';

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
  tipo?: 'oficina_central' | 'consejo' | string;
}

export interface IRolOpcion {
  id: number;
  rol: string;
}

export interface IConsejo {
  id_consejo: number;
  clave_consejo: number;
  tipo_consejo: 'D' | 'M' | string;
  consejo: string;
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
}

interface ICatalogosConsejosRaw {
  consejos: IConsejo[];
}

// Datos normalizados que devuelve el hook
export interface IUsuariosFormData {
  usuarios: IUsuario[];
  roles: IRolOpcion[];
  consejos: IConsejo[];
}

export interface ICreateUsuarioInput {
  tipo?: 'oficina_central' | 'consejo' | string;
  id_rol: number;
  consejo_tipo?: 'D' | 'M' | string;
  consejo_clave?: string;
  usuario: string;
  celular: string;
  paterno: string;
  materno: string;
  nombre: string;
  password?: string;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

const QK_USUARIOS_FORM = 'usuarios-form' as const;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Carga inicial: /Usuarios/form (usuarios + roles) y /Catalogos?catalogos=CONSEJOS.
 * Este hook normaliza ambos responses en arrays planos.
 */
export function useUsuariosFormData() {
  return useQuery({
    queryKey: [QK_USUARIOS_FORM],
    queryFn: async () => {
      const [{ data: formData }, { data: catalogosData }] = await Promise.all([
        apiClient.get<IFormDataRaw>(API_ENDPOINTS.USUARIOS.FORM),
        apiClient.get<ICatalogosConsejosRaw>(API_ENDPOINTS.CATALOGOS.LIST('CONSEJOS')),
      ]);

      const result: IUsuariosFormData = {
        usuarios: formData.usuarios?.data?.activos ?? [],
        roles: formData.roles?.data ?? [],
        consejos: Array.isArray(catalogosData?.consejos) ? catalogosData.consejos : [],
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
      toastSuccess('Usuario creado correctamente.');
    },
    onError: (error: unknown) => {
      // existe toast en interceptor.
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
      toastSuccess('Usuario actualizado correctamente.');
    },
    onError: (error: unknown) => {
      // existe toast en interceptor.
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
      toastSuccess('Usuario eliminado correctamente.');
    },
    onError: (error: unknown) => {
      toastError((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al eliminar el usuario.');
    },
  });
}
