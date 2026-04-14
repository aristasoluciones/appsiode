// ============================================================
// TEMPLATE: app/(protected)/[module-name]/components/[module-name]-data.ts
// React Query hooks + axios calls for [module-name]
//
// Replace all [Bracketed] placeholders before use:
//   [ModuleName]  → e.g. Sesion (singular PascalCase)
//   [ModuleNames] → e.g. Sesiones (plural)
//   [module-name] → e.g. sesiones (plural kebab, for BFF endpoint)
// ============================================================
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints'; // ← API_ENDPOINTS siempre, NO API_ENDPOINTS
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────

export interface I[ModuleName] {
  id: string;
  // TODO: add entity properties
  // nombre: string;
  // estado: T[ModuleName]Estado;
  createdAt: string;
  updatedAt: string;
}

export interface I[ModuleName]Filters {
  search?: string;
  // status?: string;
  // page?: number;
  // pageSize?: number;
}

export interface ICreate[ModuleName]Input {
  // TODO: define create payload
  // nombre: string;
}

// type T[ModuleName]Estado = 'activo' | 'inactivo' | 'pendiente';

// ── Query Key ────────────────────────────────────────────────

const QK = '[module-name]' as const;

// ── Queries ──────────────────────────────────────────────────

/** Fetch list of [ModuleName] */
export function use[ModuleNames]Data(filters?: I[ModuleName]Filters) {
  return useQuery({
    queryKey: [QK, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<I[ModuleName][]>(
        API_ENDPOINTS.[MODULE_NAME_UPPER].LIST,
        { params: filters },
      );
      return data;
    },
  });
}

/** Fetch single [ModuleName] by ID */
export function use[ModuleName]ById(id: string) {
  return useQuery({
    queryKey: [QK, id],
    queryFn: async () => {
      const { data } = await apiClient.get<I[ModuleName]>(
        API_ENDPOINTS.[MODULE_NAME_UPPER].GET(id),
      );
      return data;
    },
    enabled: !!id,
  });
}

// ── Mutations ────────────────────────────────────────────────

/** Create a new [ModuleName] */
export function useCreate[ModuleName]() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ICreate[ModuleName]Input) => {
      const { data } = await apiClient.post<I[ModuleName]>(
        API_ENDPOINTS.[MODULE_NAME_UPPER].CREATE,
        payload,
      );
      return data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [QK] });
      queryClient.setQueryData([QK, created.id], created);
      toast.success('[ModuleName] creado correctamente.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? 'Error al crear [module-name].');
    },
  });
}

/** Update existing [ModuleName] */
export function useUpdate[ModuleName]() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<I[ModuleName]> }) => {
      const { data: updated } = await apiClient.put<I[ModuleName]>(
        API_ENDPOINTS.[MODULE_NAME_UPPER].UPDATE(id),
        data,
      );
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([QK, updated.id], updated);
      queryClient.invalidateQueries({ queryKey: [QK] });
      toast.success('[ModuleName] actualizado correctamente.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? 'Error al actualizar [module-name].');
    },
  });
}

/** Delete a [ModuleName] by ID */
export function useDelete[ModuleName]() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.[MODULE_NAME_UPPER].DELETE(id));
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: [QK, id] });
      queryClient.invalidateQueries({ queryKey: [QK] });
      toast.success('[ModuleName] eliminado correctamente.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? 'Error al eliminar [module-name].');
    },
  });
}
