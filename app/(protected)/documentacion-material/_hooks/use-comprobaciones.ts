'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IComprobacionCapturaPayload,
  IComprobacionCapturaResultado,
  IComprobacionesData,
  IComprobacionHistorial,
} from '@/types/material-electoral';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { MATERIAL_ELECTORAL_KEYS } from '@/lib/query-keys';
import { toastInfo, toastSuccess, toastWarning } from '@/lib/toast';

/** Lista vacía para que la pantalla siempre reciba la misma forma de datos. */
const SIN_DATOS: IComprobacionesData = {
  id_consejo: 0,
  tipo_consejo: 'D',
  elecciones: [],
  resumen: {
    total: 0,
    capturados: 0,
    sin_informacion: 0,
    sin_inconsistencias: 0,
    con_faltantes: 0,
    con_excedentes: 0,
    porcentaje: 0,
    completo: false,
  },
  documentos: [],
};

/**
 * Documentación y material del consejo con su comprobación. Se piden todas las
 * elecciones de una vez: el filtro por elección y por estatus se resuelve en
 * pantalla, sin volver al servidor.
 */
export function useComprobaciones(
  tipoConsejo: 'D' | 'M' | null,
  idConsejo: number | null,
) {
  return useQuery<IComprobacionesData>({
    queryKey: MATERIAL_ELECTORAL_KEYS.comprobacionesConsejo(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
      'TODAS',
    ),
    enabled: !!tipoConsejo && !!idConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IComprobacionesData>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.COMPROBACIONES(
          idConsejo!,
          tipoConsejo!,
        ),
      );
      return {
        ...SIN_DATOS,
        ...data,
        elecciones: data?.elecciones ?? [],
        documentos: data?.documentos ?? [],
        resumen: data?.resumen ?? SIN_DATOS.resumen,
      };
    },
    staleTime: 30_000,
  });
}

/** Historial de un renglón; solo se pide con la ventana abierta. */
export function useComprobacionHistorial(
  id: number | null,
  tipoConsejo: 'D' | 'M' | null,
  idConsejo: number | null,
) {
  return useQuery<IComprobacionHistorial>({
    queryKey: MATERIAL_ELECTORAL_KEYS.comprobacionHistorial(
      tipoConsejo ?? 'NONE',
      idConsejo ?? 0,
      id ?? 0,
    ),
    enabled: !!id && !!tipoConsejo && !!idConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IComprobacionHistorial>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.COMPROBACION_HISTORIAL(
          id!,
          idConsejo!,
          tipoConsejo!,
        ),
      );
      return { ...data, eventos: data?.eventos ?? [] };
    },
  });
}

/**
 * Captura la cantidad física de un renglón. La diferencia, el estatus y la
 * obligatoriedad de las observaciones las resuelve el servidor; al guardar se
 * refrescan la lista y el historial del renglón.
 */
export function useCapturarComprobacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IComprobacionCapturaPayload) => {
      const { data } = await apiClient.post<IComprobacionCapturaResultado>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.COMPROBACION_CAPTURA,
        payload,
      );
      return data;
    },
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_ELECTORAL_KEYS.comprobaciones(),
      });
      queryClient.invalidateQueries({
        queryKey: MATERIAL_ELECTORAL_KEYS.comprobacionHistorial(
          payload.tipo_consejo,
          payload.id_consejo,
          payload.id,
        ),
      });
      toastSuccess('Comprobación física guardada con éxito.');
      // El aviso de un acta que no incluye esta captura va primero: es específico
      // y no se espera; el de actas pendientes puede ceder.
      if (data?.acta_aviso) {
        toastWarning(data.acta_aviso.mensaje);
      } else {
        sugerirActa(data);
      }
      queryClient.invalidateQueries({
        queryKey: MATERIAL_ELECTORAL_KEYS.actas(),
      });
    },
  });
}

/** Momento del último aviso de acta pendiente, para no repetirlo en cada captura. */
let ultimoAvisoActa = 0;
const ESPERA_AVISO_ACTA = 5 * 60_000;

/**
 * Aviso no bloqueante tras la captura: si el consejo tiene comprobaciones que
 * ningún acta aceptada ampara, conviene revisar si toca generar una. Se avisa
 * como mucho cada cinco minutos para no estorbar una captura larga.
 */
function sugerirActa(data: IComprobacionCapturaResultado | undefined) {
  if (!data?.acta_pendiente) return;
  const ahora = Date.now();
  if (ahora - ultimoAvisoActa < ESPERA_AVISO_ACTA) return;
  ultimoAvisoActa = ahora;
  const n = data.acta_pendientes;
  toastInfo(
    `Tienes ${n} ${n === 1 ? 'renglón comprobado' : 'renglones comprobados'} sin acta circunstanciada aceptada. Cuando termines la comprobación, revisa en «Actas Circunstanciadas» si conviene generar una.`,
  );
}
