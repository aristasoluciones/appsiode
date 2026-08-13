'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEnlacesExternos } from '@/hooks/use-enlaces-externos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { CATALOGOS_KEYS, EXTERNOS_KEYS } from '@/lib/query-keys';
import type { IConsejeroExterno } from '@/types/sesiones';
import type {
  IAperturasCatalogosData,
  ICatalogoEleccion,
  ICatalogoCasilla,
  ICatalogoCargoApertura,
  ICatalogoProcedencia,
} from '@/types/aperturas-bodegas';

export interface IRepresentanteExternoAPI {
  id: number;
  address: string | null;
  paternal: string | null;
  maternal: string | null;
  phone: string | null;
  mobilePhone: string | null;
  email: string | null;
  name: string;
  sex: string | null;
  charge: string;
  party_id: number;
  party: { id: number; name: string; imagePath: string | null } | null;
  appointments: {
    invoice: string | null;
    expedition: string | null;
    documentPath: string | null;
    reception: string | null;
    status: string | null;
  }[];
}

export interface IRepresentanteNorm {
  id_representante: number;
  id_partido: number;
  partyName: string;
  partyImagePath: string | null;
  nombre: string;
  apellidos: string;
  cargo: string;
  asistencia: boolean;
}

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

// ─── Consejeros electorales (SICE) ────────────────────────────────────────────

export function useIntegracionApertura(
  tipoConsejo: 'D' | 'M' | null,
  claveConsejo: string | number | null,
) {
  return useQuery<IConsejeroExterno[]>({
    queryKey: EXTERNOS_KEYS.integracionSice(tipoConsejo, claveConsejo),
    queryFn: async () => {
      if (claveConsejo === null || claveConsejo === undefined) return [];
      const { data } = await axios.get<IConsejeroExterno[]>(
        '/api/sice-proxy/integracion',
      );
      const tipo = (tipoConsejo ?? '').toUpperCase();
      const clave = Number(claveConsejo);
      return Array.isArray(data)
        ? data.filter(
            (c) =>
              c.consejo_tipo.toUpperCase() === tipo && c.consejo_clave === clave,
          )
        : [];
    },
    enabled: !!tipoConsejo && claveConsejo !== null && claveConsejo !== undefined,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ─── Representantes de partidos políticos (RPP externo) ───────────────────────

export function useRepresentantesExternosApertura(
  tipo: 'd' | 'm' | null,
  idConsejo: string | number | null,
) {
  const { rppApiBase } = useEnlacesExternos();

  return useQuery<IRepresentanteExternoAPI[]>({
    queryKey: EXTERNOS_KEYS.representantesApertura(tipo, idConsejo),
    queryFn: async () => {
      if (!tipo || idConsejo === null || idConsejo === undefined) return [];
      const param = tipo === 'd' ? 'district' : 'town';
      const { data } = await axios.get<IRepresentanteExternoAPI[]>(
        `${rppApiBase}/api/representatives?${param}=${idConsejo}&approved=1`,
      );
      return Array.isArray(data) ? data : [];
    },
    enabled:
      !!tipo && !!rppApiBase && idConsejo !== null && idConsejo !== undefined,
    staleTime: 60_000,
    retry: 1,
  });
}

// ─── Normalización de representantes ──────────────────────────────────────────

export function normalizeRepresentanteApertura(
  r: IRepresentanteExternoAPI,
): IRepresentanteNorm {
  return {
    id_representante: r.id,
    id_partido: r.party_id,
    partyName: r.party?.name ?? '',
    partyImagePath: r.party?.imagePath ?? null,
    nombre: r.name,
    apellidos: [r.paternal, r.maternal].filter(Boolean).join(' '),
    cargo: r.charge,
    asistencia: false,
  };
}
