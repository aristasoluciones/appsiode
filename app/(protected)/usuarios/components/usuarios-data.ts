'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { USUARIOS_KEYS } from '@/lib/query-keys';
import { toastSuccess, toastError } from '@/lib/toast';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IUsuario {
  id: number;
  usuario: string;       // correo electrónico / login
  nombre: string;
  paterno: string;
  materno: string;
  celular: string | null;
  /** 'ACT' activa, 'DEL' eliminada. */
  status: string;
  id_rol: number;
  rol?: string;
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

/** Respuesta de /Usuarios: las eliminadas llegan aparte, en `inactivos`. */
interface IUsuariosListaRaw {
  activos: IUsuario[];
  inactivos: IUsuario[];
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

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Carga inicial: /Usuarios/form (usuarios + roles) y /Catalogos?catalogos=CONSEJOS.
 * Este hook normaliza ambos responses en arrays planos.
 */
export function useUsuariosFormData() {
  return useQuery({
    queryKey: USUARIOS_KEYS.form(),
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

/**
 * Cuentas eliminadas. Se piden aparte y solo cuando la pantalla las muestra,
 * porque la carga del formulario entrega únicamente las activas.
 */
export function useUsuariosEliminados(enabled: boolean) {
  return useQuery({
    queryKey: USUARIOS_KEYS.eliminadas(),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<IUsuariosListaRaw>(
        API_ENDPOINTS.USUARIOS.LIST(true),
      );
      return Array.isArray(data?.inactivos) ? data.inactivos : [];
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
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.form() });
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
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.form() });
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
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.form() });
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.eliminadas() });
      toastSuccess('Usuario eliminado correctamente.');
    },
    onError: (error: unknown) => {
      toastError((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al eliminar el usuario.');
    },
  });
}

/** Devuelve una cuenta eliminada al estado activo, con su rol y su consejo. */
export function useReactivarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idUsuario: number) => {
      await apiClient.put(
        API_ENDPOINTS.USUARIOS.REACTIVAR(idUsuario),
        getDataAuditoria(),
      );
      return idUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.form() });
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.eliminadas() });
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.historial() });
      toastSuccess('Cuenta reactivada. Ya puede entrar al sistema.');
    },
    // Errores: los avisa el toast global del cliente de queries.
  });
}
