'use client';

import type { TTipoConsejoChar } from '@/types/mecanismos';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useDescargaExcel } from '@/hooks/use-descarga-excel';

const ERROR_REPORTE = 'No se pudo generar el reporte. Intenta nuevamente.';

const plural = (tipoConsejo: TTipoConsejoChar) =>
  tipoConsejo === 'D' ? 'distritales' : 'municipales';

/**
 * Mecanismos del tipo de consejo: ruta, estatus, CAE, costo estimado, cédula
 * (sí/no) y observaciones (total y última); exclusivo de oficina central.
 */
export function useDescargarReporteMecanismos() {
  return useDescargaExcel<TTipoConsejoChar>(
    (tipoConsejo) => API_ENDPOINTS.MECANISMOS.REPORTE_MECANISMOS(tipoConsejo),
    (tipoConsejo) => `mecanismos-${plural(tipoConsejo)}.xlsx`,
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
