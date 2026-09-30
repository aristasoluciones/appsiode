'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ICatalogosVerificacion,
  IMarcoGeografico,
  IMecanismo,
  IMecanismoCasillasPayload,
  IMecanismoEstatusPayload,
  IMecanismoInformarPayload,
  IMecanismoLista,
  IMecanismoObservacionesPayload,
  IMecanismoObservacionTipo,
  IMecanismoPayload,
  IMecanismoSeguimiento,
  IMecanismoTipo,
  TTipoConsejoChar,
} from '@/types/mecanismos';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getDataAuditoria } from '@/lib/auditoria';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
import { toastSuccess } from '@/lib/toast';

/** Filtros de la lista; el consejo no manda ninguno porque el API toma el suyo del token. */
export interface IMecanismosFiltros {
  /** Oficina central: lo que ve un consejo en particular. */
  tipoConsejo?: TTipoConsejoChar | null;
  idConsejo?: number | null;
  idDf?: number | null;
  tipo?: string | null;
  /** Solo oficina central; el consejo siempre ve activos. */
  incluirInactivos?: boolean;
}

// ---------------------------------------------------------------- Catálogos

/** Tipos de mecanismo (DAT, CRyT fijo, CRyT itinerante); no cambian durante la sesión. */
export function useMecanismosTipos(incluirInactivos = false) {
  return useQuery({
    queryKey: MECANISMOS_KEYS.tipos(incluirInactivos),
    queryFn: async () => {
      const { data } = await apiClient.get<IMecanismoTipo[]>(
        API_ENDPOINTS.MECANISMOS.TIPOS(incluirInactivos),
      );
      return data ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

/** Tipos de observación del informe; se piden solo con la ventana de informe abierta. */
export function useObservacionesTipos(habilitado = true) {
  return useQuery({
    enabled: habilitado,
    queryKey: MECANISMOS_KEYS.observacionesTipos(),
    queryFn: async () => {
      const { data } = await apiClient.get<IMecanismoObservacionTipo[]>(
        API_ENDPOINTS.MECANISMOS.OBSERVACIONES_TIPOS,
      );
      return data ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

/** Marco geográfico para los combos del formulario; se pide solo con la ventana abierta. */
export function useMarcoGeografico(habilitado = true) {
  return useQuery({
    enabled: habilitado,
    queryKey: MECANISMOS_KEYS.marcoGeografico(),
    queryFn: async () => {
      const { data } = await apiClient.get<IMarcoGeografico[]>(
        API_ENDPOINTS.MECANISMOS.MARCO_GEOGRAFICO,
      );
      return data ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Verifica que los catálogos estén cargados antes de importar o dar de alta.
 * Con faltantes el API responde 409 y la pantalla lo muestra en su alerta.
 */
export function useCatalogosVerificacion(habilitado = true) {
  return useQuery({
    enabled: habilitado,
    meta: { silenciarToast: true },
    queryKey: MECANISMOS_KEYS.catalogosVerificacion(),
    queryFn: async () => {
      const { data } = await apiClient.get<ICatalogosVerificacion>(
        API_ENDPOINTS.MECANISMOS.CATALOGOS_VERIFICACION,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------- Consultas

/**
 * Lista de mecanismos. El consejo recibe los que informa, con su informe, sus
 * banderas y sus casillas propias; oficina central recibe todos con filtros o,
 * con consejo, lo que ese consejo ve.
 */
export function useMecanismos(
  filtros: IMecanismosFiltros = {},
  habilitado = true,
) {
  const tipoConsejo = filtros.tipoConsejo ?? null;
  const idConsejo = filtros.idConsejo ?? null;
  const idDf = filtros.idDf ?? null;
  const tipo = filtros.tipo ?? null;
  const incluirInactivos = filtros.incluirInactivos ?? false;

  return useQuery<IMecanismoLista[]>({
    enabled: habilitado,
    queryKey: MECANISMOS_KEYS.lista(
      tipoConsejo ?? 'TODOS',
      idConsejo ?? 0,
      idDf ?? 0,
      tipo ?? 'TODOS',
      incluirInactivos,
    ),
    queryFn: async () => {
      const { data } = await apiClient.get<IMecanismoLista[]>(
        API_ENDPOINTS.MECANISMOS.LISTA({
          tipoConsejo: tipoConsejo ?? undefined,
          idConsejo: idConsejo ?? undefined,
          idDf: idDf ?? undefined,
          tipo: tipo ?? undefined,
          incluirInactivos,
        }),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

/** Detalle del mecanismo con consejos y casillas; solo se pide con la ventana abierta. */
export function useMecanismo(id: number | null) {
  return useQuery<IMecanismo>({
    queryKey: MECANISMOS_KEYS.detalle(id ?? 0),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.DETALLE(id!),
      );
      return data;
    },
  });
}

/** Seguimiento de oficina central: todos los consejos del tipo, aunque vayan en ceros. */
export function useSeguimiento(
  tipoConsejo: TTipoConsejoChar | null,
  habilitado = true,
) {
  return useQuery<IMecanismoSeguimiento[]>({
    queryKey: MECANISMOS_KEYS.seguimientoTipo(tipoConsejo ?? 'NONE'),
    enabled: habilitado && !!tipoConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IMecanismoSeguimiento[]>(
        API_ENDPOINTS.MECANISMOS.SEGUIMIENTO(tipoConsejo!),
      );
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------- Escrituras

/**
 * Cualquier escritura sobre un mecanismo rehace las listas y el seguimiento.
 * El detalle se deja en caché con lo que devolvió el servidor, sin volver a pedirlo.
 */
export function guardarMecanismoEnCache(
  queryClient: ReturnType<typeof useQueryClient>,
  mecanismo: IMecanismo,
) {
  queryClient.setQueryData(MECANISMOS_KEYS.detalle(mecanismo.id), mecanismo);
  queryClient.invalidateQueries({
    queryKey: MECANISMOS_KEYS.mecanismos(),
    predicate: (q) => q.queryKey[2] !== 'detalle',
  });
  queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.seguimiento() });
}

/** Alta de un mecanismo por oficina central, con consejos y casillas. */
export function useCrearMecanismo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IMecanismoPayload) => {
      const { data } = await apiClient.post<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CREAR,
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      guardarMecanismoEnCache(queryClient, mecanismo);
      toastSuccess('Mecanismo registrado.');
    },
  });
}

/** Edición del mecanismo; el territorio no cambia si el consejo ya lo informó. */
export function useEditarMecanismo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IMecanismoPayload;
    }) => {
      const { data } = await apiClient.put<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.DETALLE(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      guardarMecanismoEnCache(queryClient, mecanismo);
      toastSuccess('Mecanismo actualizado.');
    },
  });
}

/** Reemplaza el detalle de casillas del mecanismo. */
export function useReemplazarCasillas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IMecanismoCasillasPayload;
    }) => {
      const { data } = await apiClient.put<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.CASILLAS(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      guardarMecanismoEnCache(queryClient, mecanismo);
      toastSuccess('Casillas actualizadas.');
    },
  });
}

/** Baja lógica o reactivación del mecanismo. */
export function useCambiarEstatusMecanismo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IMecanismoEstatusPayload;
    }) => {
      const { data } = await apiClient.patch<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.ESTATUS(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      guardarMecanismoEnCache(queryClient, mecanismo);
      toastSuccess(
        mecanismo.activo ? 'Mecanismo activado.' : 'Mecanismo dado de baja.',
      );
    },
  });
}

/** Observaciones de oficina central sobre el mecanismo; vacías para retirarlas. */
export function useGuardarObservacionesMecanismo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IMecanismoObservacionesPayload;
    }) => {
      const { data } = await apiClient.put<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.OBSERVACIONES(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo) => {
      guardarMecanismoEnCache(queryClient, mecanismo);
      toastSuccess('Observaciones guardadas.');
    },
  });
}

/**
 * Informe del consejo que revisa el mecanismo: cada guardado agrega una
 * observación tipificada; con «Informar» captura costo y CAE (según la
 * configuración del consejo) y el estatus pasa a Informado. El CAE queda
 * congelado en el mecanismo.
 */
export function useInformarMecanismo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: IMecanismoInformarPayload;
    }) => {
      const { data } = await apiClient.put<IMecanismo>(
        API_ENDPOINTS.MECANISMOS.INFORME(id),
        { ...payload, ...getDataAuditoria() },
      );
      return data;
    },
    onSuccess: (mecanismo, { payload }) => {
      guardarMecanismoEnCache(queryClient, mecanismo);
      if (payload.informar) {
        // El informe cambia cuántos mecanismos atiende cada CAE.
        queryClient.invalidateQueries({ queryKey: MECANISMOS_KEYS.caes() });
      }
      toastSuccess(
        payload.informar ? 'Mecanismo informado.' : 'Observación registrada.',
      );
    },
  });
}
