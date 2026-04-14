'use client';

import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toastSuccess, toastError } from '@/lib/toast';
import type {
  ISesionDetalle,
  ISesionDetalleAPI,
  ISesionDetalleResponseEnvelope,
  IConsejeroAsistenciaInput,
} from '@/types/sesiones';

// ─── Tipos externos: representantes de partidos ───────────────────────────────

export interface IRepresentanteExternoAPI {
  id: number;
  address: string | null;
  paternal: string;
  maternal: string;
  phone: string | null;
  mobilePhone: string | null;
  email: string | null;
  name: string;
  sex: string;
  charge: string;
  party_id: number;
  party: { id: number; name: string; imagePath: string };
  appointments: {
    invoice: string | null;
    expedition: string | null;
    documentPath: string | null;
    reception: string | null;
    status: string | null;
  }[];
}

export function useRepresentantesExternos(tipo: 'd' | 'm', idConsejo: string | null) {
  return useQuery({
    queryKey: ['representantes-externos', tipo, idConsejo],
    queryFn: async (): Promise<IRepresentanteExternoAPI[]> => {
      const BASE = process.env.NEXT_PUBLIC_RPP_API_BASE;
      if (!BASE || idConsejo === null) return [];
      const param = tipo === 'd' ? 'district' : 'town';
      const { data } = await axios.get<IRepresentanteExternoAPI[]>(
        `${BASE}/api/representatives?${param}=${idConsejo}&approved=1`,
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: idConsejo !== null,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useGuardarAsistencia(idSesion: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { asistencia: { id: number; asistencia: boolean }[] }) =>
      apiClient.put(API_ENDPOINTS.SESIONES.SAVE_ASISTENCIA(idSesion), payload),
    onSuccess: () => {
      toastSuccess('Asistencia guardada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['sesiones', 'detalle', idSesion] });
      queryClient.invalidateQueries({ queryKey: ['votos', idSesion] });
    },
    onError: () => toastError('No se pudo guardar la asistencia. Intenta nuevamente.'),
  });
}

export function useIniciarSesion(idSesion: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { consejeros: IConsejeroAsistenciaInput[] }) =>
      apiClient.put(API_ENDPOINTS.SESIONES.INICIAR_SESION(idSesion), payload),
    onSuccess: () => {
      toastSuccess('Sesión iniciada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['sesiones', 'detalle', idSesion] });
    },
  });
}

export interface ITerminarRepresentantePayload {
  id_partido: number;
  id_representante: number;
  nombre: string;
  apellidos: string;
  cargo: string;
  genero: string;
  nombramiento_no: string | null;
  nombramiento_fecha: string | null;
  nombramiento_url: string | null;
  nombramiento_status: string | null;
  asistencia: boolean;
  domicilio: string | null;
  tel_casa: string | null;
  tel_cel: string | null;
  correo: string | null;
}

export function useTerminarSesion(idSesion: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { representantes: ITerminarRepresentantePayload[] }) =>
      apiClient.put(API_ENDPOINTS.SESIONES.TERMINAR_SESION(idSesion), payload),
    onSuccess: () => {
      toastSuccess('Sesión concluida correctamente.');
      queryClient.invalidateQueries({ queryKey: ['sesiones', 'detalle', idSesion] });
    },
    onError: () => toastError('No se pudo terminar la sesión. Intenta nuevamente.'),
  });
}

// ─── Votación ─────────────────────────────────────────────────────────────────

export type TVoto = 'AFAVOR' | 'ENCONTRA' | 'ABSTENCION';

export interface IVotoInput {
  id_asistencia: number;
  id_punto: number;
  id_subpunto: number;
  voto: TVoto;
}

export function useVotar(idSesion: string) {
  return useMutation({
    mutationFn: (voto: IVotoInput) =>
      apiClient.put(API_ENDPOINTS.SESIONES.VOTAR(idSesion), voto),
    onSuccess: () => toastSuccess('Votación registrada correctamente.'),
  });
}

export function useObtenerVotos(idSesion: string) {
  return useQuery({
    queryKey: ['votos', idSesion],
    queryFn: () =>
      apiClient.get(API_ENDPOINTS.SESIONES.OBTENER_VOTOS(idSesion)),
    enabled: !!idSesion,
  });
}

export function useAgregarAsuntoGeneral(idSesion: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (descripcion: string) =>
      apiClient.post(API_ENDPOINTS.SESIONES.AGREGAR_ASUNTO_GENERAL(idSesion), { descripcion }),
    onSuccess: () => {
      toastSuccess('Asunto general agregado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['sesiones', 'detalle', idSesion] });
    },
  });
}

export interface ISesionDetalleResult {
  session: ISesionDetalle | null;
  notFound: boolean;
}

function mapDetalle(data: ISesionDetalleAPI): ISesionDetalle {
  return {
    id: data.sesion.id,
    noSesion: data.sesion.no_sesion,
    tipo: data.sesion.tipo,
    status: data.sesion.status,
    fechaProgramada: data.sesion.fecha_hora,
    fechaInicio: data.sesion.fecha_inicio,
    fechaConclusion: data.sesion.fecha_conclusion,
    statusText: data.sesion.status_text,
    url: data.sesion.url,
    pod: data.pod ?? [],
    asistencia: data.asistencia ?? [],
    asistenciaPP: data.asistencia_pp ?? [],
    incidencias: data.incidencias,
    expedientes: data.expedientes,
  };
}

export function useSesionDetalle(idSesion: string) {
  return useQuery({
    queryKey: ['sesiones', 'detalle', idSesion],
    queryFn: async (): Promise<ISesionDetalleResult> => {
      try {
        const { data } = await apiClient.get<ISesionDetalleAPI | ISesionDetalleResponseEnvelope>(
          API_ENDPOINTS.SESIONES.SESION_DETALLE(idSesion),
        );

        const payload =
          typeof data === 'object' && data !== null && 'data' in data
            ? (data as ISesionDetalleResponseEnvelope).data
            : (data as ISesionDetalleAPI);

        return {
          session: mapDetalle(payload),
          notFound: false,
        };
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return { session: null, notFound: true };
        }
        throw err;
      }
    },
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}
