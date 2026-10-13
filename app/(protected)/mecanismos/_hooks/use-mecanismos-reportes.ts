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

/**
 * Estudios de factibilidad: avance por distrito y revisiones por consejo;
 * exclusivo de oficina central. Con distritos, el Excel sale acotado a ellos.
 */
export function useDescargarReporteEstudios() {
  return useDescargaExcel<number[] | undefined>(
    (idsDf) => API_ENDPOINTS.MECANISMOS.REPORTE_ESTUDIOS(idsDf),
    (idsDf) =>
      idsDf?.length
        ? `estudios-factibilidad-df${idsDf.join('-')}.xlsx`
        : 'estudios-factibilidad.xlsx',
    ERROR_REPORTE,
  );
}

/** Nombre del PDF de cada mecanismo para armar el zip de cédulas; con `true`, solo los que aún no tienen. */
export function useDescargarNombresCedulas() {
  return useDescargaExcel<boolean>(
    (soloSinCedula) =>
      API_ENDPOINTS.MECANISMOS.REPORTE_NOMBRES_CEDULAS(soloSinCedula),
    () => 'nombres-cedulas.xlsx',
    ERROR_REPORTE,
  );
}

/** Plantilla del formato de importación: columnas, ejemplos e instrucciones. */
export function useDescargarPlantillaImportacion() {
  return useDescargaExcel<void>(
    () => API_ENDPOINTS.MECANISMOS.IMPORTACION_PLANTILLA,
    () => 'formato-importacion-mecanismos.xlsx',
    'No se pudo descargar la plantilla. Intenta nuevamente.',
  );
}
