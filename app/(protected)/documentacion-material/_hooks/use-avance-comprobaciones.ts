'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { MATERIAL_ELECTORAL_KEYS } from '@/lib/query-keys';
import { toastError } from '@/lib/toast';
import type {
  IAvanceComprobaciones,
  TReporteComprobacion,
} from '@/types/material-electoral';

const TIPO_EXCEL =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Filtro de elección: una clave del proceso o todas. */
export const TODAS_ELECCIONES = 'TODAS';

/** Avance vacío, para que la pantalla siempre reciba la misma forma de datos. */
const SIN_AVANCE: IAvanceComprobaciones = {
  tipo_consejo: 'D',
  elecciones: [],
  resumen: {
    consejos: 0,
    consejos_completos: 0,
    consejos_sin_layout: 0,
    total: 0,
    capturados: 0,
    sin_informacion: 0,
    sin_inconsistencias: 0,
    con_inconsistencias: 0,
    con_faltantes: 0,
    con_excedentes: 0,
    porcentaje: 0,
  },
  consejos: [],
};

/**
 * Avance de todos los consejos del tipo, para el tablero de oficina central.
 * El filtro por elección sí vuelve al servidor —los conteos por consejo se
 * calculan ahí—; la búsqueda y el filtro por estatus se resuelven en pantalla.
 */
export function useAvanceComprobaciones(
  tipoConsejo: 'D' | 'M' | null,
  idEleccion: string = TODAS_ELECCIONES,
  habilitado = true,
) {
  return useQuery<IAvanceComprobaciones>({
    queryKey: MATERIAL_ELECTORAL_KEYS.avanceTipo(
      tipoConsejo ?? 'NONE',
      idEleccion,
    ),
    enabled: habilitado && !!tipoConsejo,
    queryFn: async () => {
      const { data } = await apiClient.get<IAvanceComprobaciones>(
        API_ENDPOINTS.MATERIAL_ELECTORAL.AVANCE_COMPROBACIONES(
          tipoConsejo!,
          idEleccion === TODAS_ELECCIONES ? undefined : idEleccion,
        ),
      );
      return {
        ...SIN_AVANCE,
        ...data,
        elecciones: data?.elecciones ?? [],
        resumen: data?.resumen ?? SIN_AVANCE.resumen,
        consejos: data?.consejos ?? [],
      };
    },
    staleTime: 30_000,
  });
}

/** Dispara la descarga de un archivo ya en memoria. */
function descargar(contenido: Blob, nombreArchivo: string) {
  const url = window.URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  window.URL.revokeObjectURL(url);
}

interface DescargaReporte {
  reporte: TReporteComprobacion;
  tipoConsejo: 'D' | 'M';
  /** Sin elección se descargan todas las activas del tipo de consejo. */
  idEleccion?: string;
  /** Solo para el reporte de un consejo. */
  idConsejo?: number;
}

function rutaReporte({
  reporte,
  tipoConsejo,
  idEleccion,
  idConsejo,
}: DescargaReporte): string {
  const eleccion =
    !idEleccion || idEleccion === TODAS_ELECCIONES ? undefined : idEleccion;

  if (reporte === 'consejo') {
    return API_ENDPOINTS.MATERIAL_ELECTORAL.REPORTE_CONSEJO(
      idConsejo!,
      tipoConsejo,
      eleccion,
    );
  }

  return reporte === 'general'
    ? API_ENDPOINTS.MATERIAL_ELECTORAL.REPORTE_GENERAL(tipoConsejo, eleccion)
    : API_ENDPOINTS.MATERIAL_ELECTORAL.REPORTE_GENERAL_DETALLADO(
        tipoConsejo,
        eleccion,
      );
}

function nombreArchivo({
  reporte,
  tipoConsejo,
  idConsejo,
}: DescargaReporte): string {
  const tipo = tipoConsejo === 'D' ? 'distritales' : 'municipales';

  if (reporte === 'consejo') {
    return `comprobacion-fisica-${tipoConsejo}${idConsejo}.xlsx`;
  }

  return reporte === 'general'
    ? `comprobacion-fisica-avance-${tipo}.xlsx`
    : `comprobacion-fisica-detallado-${tipo}.xlsx`;
}

/**
 * Descarga en Excel cualquiera de los tres reportes que genera el API. El error
 * se avisa aquí porque el cuerpo llega como binario y el toast global no puede
 * leer su mensaje.
 */
export function useDescargarReporteComprobaciones() {
  return useMutation({
    meta: { silenciarToast: true },
    mutationFn: async (descarga: DescargaReporte) => {
      const response = await apiClient.get(rutaReporte(descarga), {
        responseType: 'blob',
      });
      return { contenido: response.data as Blob, descarga };
    },
    onSuccess: ({ contenido, descarga }) => {
      descargar(
        new Blob([contenido], { type: TIPO_EXCEL }),
        nombreArchivo(descarga),
      );
    },
    onError: () =>
      toastError('No se pudo generar el reporte. Intenta nuevamente.'),
  });
}
