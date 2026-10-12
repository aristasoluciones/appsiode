'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { CATALOGOS_KEYS } from '@/lib/query-keys';
import type {
  IAperturasCatalogosData,
  ICatalogoEleccion,
  ICatalogoCasilla,
  ICatalogoCargoApertura,
  ICatalogoProcedencia,
} from '@/types/aperturas-bodegas';

// ─── Catálogos ────────────────────────────────────────────────────────────────

export function useCatalogosAperturas(enabled = true) {
  return useQuery<IAperturasCatalogosData>({
    queryKey: CATALOGOS_KEYS.aperturas(),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<{
        elecciones?: ICatalogoEleccion[];
        casillas?: ICatalogoCasilla[];
        secciones?: { seccion: number }[];
        cargos_apertura_bodegas?: ICatalogoCargoApertura[];
        consejos?: IAperturasCatalogosData['consejos'];
        procedencias?: ICatalogoProcedencia[];
      }>(
        API_ENDPOINTS.CATALOGOS.LIST(
          'ELECCIONES,CONSEJOS,CASILLAS,SECCIONES,CARGOS_APERTURA_BODEGAS,PROCEDENCIAS',
        ),
      );

      const elecciones = data.elecciones ?? [];
      const casillas = data.casillas ?? [];
      const secciones = data.secciones ?? [];
      const cargos = data.cargos_apertura_bodegas ?? [];
      const procedencias = data.procedencias ?? [];

      return {
        elecciones,
        casillas,
        secciones,
        cargosApertura: cargos,
        consejos: data.consejos ?? [],
        procedencias,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
