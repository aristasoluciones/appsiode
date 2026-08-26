'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AUTH_KEYS, USUARIOS_KEYS } from '@/lib/query-keys';
import type { IEventoTipo, IHistorialCuenta } from '@/types/auth';

/** Eventos por página del historial. */
export const HISTORIAL_TAMANIO = 15;

const VACIO: IHistorialCuenta = {
  total: 0,
  pagina: 1,
  tamanio: HISTORIAL_TAMANIO,
  paginas: 0,
  eventos: [],
};

// La pantalla muestra el fallo en su propia alerta con botón de reintentar:
// se silencia el toast global para no duplicar el aviso.
const SILENCIAR = { silenciarToast: true } as const;

interface HistorialArgs {
  /** Cuenta consultada. Sin valor se consulta la del propio usuario. */
  idUsuario?: number | null;
  pagina: number;
  /** Clave del evento («sesion.inicio») o su categoría («sesion»). */
  tipo?: string | null;
  enabled?: boolean;
}

/**
 * Página del historial de una cuenta. Con `idUsuario` consulta la ruta
 * administrativa (requiere el permiso de historial); sin él, la del perfil,
 * que cada usuario puede ver sobre su propia cuenta sin permiso adicional.
 */
export function useHistorialCuenta({
  idUsuario,
  pagina,
  tipo = null,
  enabled = true,
}: HistorialArgs) {
  const propia = idUsuario == null;

  return useQuery({
    queryKey: propia
      ? AUTH_KEYS.historial(pagina, tipo)
      : USUARIOS_KEYS.historial(idUsuario, pagina, tipo),
    enabled,
    meta: SILENCIAR,
    // Al cambiar de página o de filtro se conserva lo anterior en pantalla
    // mientras llega la nueva página, en lugar de parpadear en vacío.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const url = propia
        ? API_ENDPOINTS.AUTH.HISTORIAL(pagina, HISTORIAL_TAMANIO, tipo)
        : API_ENDPOINTS.USUARIOS.HISTORIAL(
            idUsuario,
            pagina,
            HISTORIAL_TAMANIO,
            tipo,
          );
      const { data } = await apiClient.get<IHistorialCuenta>(url);
      return data ?? VACIO;
    },
  });
}

/** Catálogo de tipos de evento con el que la pantalla arma su filtro. */
export function useTiposEvento(enabled = true) {
  return useQuery({
    queryKey: USUARIOS_KEYS.historialTipos(),
    enabled,
    meta: SILENCIAR,
    // El catálogo no cambia durante la sesión.
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const { data } = await apiClient.get<IEventoTipo[]>(
        API_ENDPOINTS.USUARIOS.HISTORIAL_TIPOS,
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
