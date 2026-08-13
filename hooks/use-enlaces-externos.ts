'use client';

import { useProceso } from '@/hooks/use-proceso';

/**
 * Enlaces a los sistemas externos (RPP y SICE) del proceso electoral activo.
 *
 * Los administra la pantalla de Procesos Electorales y viajan dentro de la
 * respuesta del proceso, no en variables de build: un enlace cambiado a media
 * sesión aplica en la siguiente recarga o inicio de sesión.
 */
export function useEnlacesExternos() {
  const { data: proceso, isLoading } = useProceso();

  return {
    rppApiBase: proceso?.configuracion?.rpp_api_base?.replace(/\/+$/, '') ?? '',
    siceApiBase: proceso?.configuracion?.sice_api_base?.replace(/\/+$/, '') ?? '',
    isLoading,
  };
}
