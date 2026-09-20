'use client';

import type {
  TCedulaEstatus,
  TDiferenciaFiltro,
  TTipoConsejoChar,
} from '@/types/mecanismos';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useDescargaExcel } from '@/hooks/use-descarga-excel';

const ERROR_REPORTE = 'No se pudo generar el reporte. Intenta nuevamente.';

const plural = (tipoConsejo: TTipoConsejoChar) =>
  tipoConsejo === 'D' ? 'distritales' : 'municipales';

/** Mecanismos del tipo de consejo (ruta, CAE, costo estimado, cédula); exclusivo de oficina central. */
export function useDescargarReporteMecanismos() {
  return useDescargaExcel<TTipoConsejoChar>(
    (tipoConsejo) => API_ENDPOINTS.MECANISMOS.REPORTE_MECANISMOS(tipoConsejo),
    (tipoConsejo) => `mecanismos-${plural(tipoConsejo)}.xlsx`,
    ERROR_REPORTE,
  );
}

/** Cédulas de un consejo; el consejo solo exporta las suyas. */
export function useDescargarReporteCedulasConsejo() {
  return useDescargaExcel<{ tipoConsejo: TTipoConsejoChar; idConsejo: number }>(
    ({ tipoConsejo, idConsejo }) =>
      API_ENDPOINTS.MECANISMOS.REPORTE_CEDULAS_CONSEJO(idConsejo, tipoConsejo),
    ({ tipoConsejo, idConsejo }) =>
      `cedulas-${plural(tipoConsejo)}-${idConsejo}.xlsx`,
    ERROR_REPORTE,
  );
}

/** Cédulas generales con los filtros de la bandeja; exclusivo de oficina central. */
export function useDescargarReporteCedulasGeneral() {
  return useDescargaExcel<{
    tipoConsejo: TTipoConsejoChar;
    estatus?: TCedulaEstatus | null;
    diferencia?: TDiferenciaFiltro | null;
  }>(
    ({ tipoConsejo, estatus, diferencia }) =>
      API_ENDPOINTS.MECANISMOS.REPORTE_CEDULAS_GENERAL(tipoConsejo, {
        estatus: estatus ?? undefined,
        diferencia: diferencia ?? undefined,
      }),
    ({ tipoConsejo }) => `cedulas-${plural(tipoConsejo)}.xlsx`,
    ERROR_REPORTE,
  );
}

/** Estudios de factibilidad: avance por distrito y acuses por consejo; exclusivo de oficina central. */
export function useDescargarReporteEstudios() {
  return useDescargaExcel<void>(
    () => API_ENDPOINTS.MECANISMOS.REPORTE_ESTUDIOS,
    () => 'estudios-factibilidad.xlsx',
    ERROR_REPORTE,
  );
}
