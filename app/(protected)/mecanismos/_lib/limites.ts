/**
 * Límites que impone el API a los formularios y cargas del módulo; aquí se
 * repiten solo como experiencia de usuario, la validación autoritativa es del API.
 */
export const MECANISMOS_LIMITES = {
  /** PDF de cédula o de estudio: un solo límite para todos los casos. */
  pdf: { bytes: 10 * 1024 * 1024, tipos: ['application/pdf'] as const },
  /** Archivo del INE, listado de CAE y Excel de asignación. */
  excel: {
    bytes: 5 * 1024 * 1024,
    extensiones: ['.xlsx', '.csv'] as const,
    filas: 20000,
  },
  /** Zip con los PDF de cédula nombrados como los entrega el INE. */
  zip: { bytes: 200 * 1024 * 1024, entradas: 2500 },
  costo: { min: 0, max: 9_999_999.99 },
  observaciones: { max: 2000 },
  motivo: { min: 10, max: 1000 },
  caeFolio: { max: 30 },
  numero: { min: 1, max: 999 },
  distanciaKm: { min: 0, max: 99999.99 },
  /** Se captura como HH:MM y viaja en minutos (tope 99:59). */
  tiempoRecorridoMinutos: { min: 0, max: 5999 },
  eleccionAtendida: { max: 30 },
  consejos: { min: 1, max: 30 },
  casillas: { max: 200 },
  /** Nomenclatura del INE: B1, C1, E1, E1 C1, S1. */
  casillaTipo: /^(B1|C\d{1,2}|E\d{1,2}( C\d{1,2})?|S\d{1,2})$/,
} as const;
