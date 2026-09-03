import { qs, type Id } from './_shared';

/**
 * Documentación y material electoral. Los endpoints de `layouts` son exclusivos
 * de oficina central y exigen el permiso de cargar el layout.
 */
export const MATERIAL_ELECTORAL = {
  /** Catálogo de tipos de documentación y material vigente. */
  LAYOUT_TIPOS: (incluirInactivos?: boolean) =>
    `/material-electoral/layouts/tipos${qs({ incluirInactivos: incluirInactivos ? 'true' : undefined })}`,
  /** Formato de captura (xlsx) del tipo de consejo, con sus listas desplegables. */
  LAYOUT_FORMATO: (tipoConsejo: 'D' | 'M') =>
    `/material-electoral/layouts/formato${qs({ tipoConsejo })}`,
  /** Revisa el archivo y devuelve la vista previa, sin guardar nada. */
  LAYOUT_VALIDAR: '/material-electoral/layouts/validar',
  /** Carga los renglones del layout; si una fila tiene observaciones no se carga ninguna. */
  LAYOUT_CARGAR: '/material-electoral/layouts',

  /** Lista de comprobación del consejo; sin `idEleccion` vienen todas las elecciones. */
  COMPROBACIONES: (idConsejo: Id, tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/comprobaciones${qs({ idConsejo, tipoConsejo, idEleccion })}`,
  /** Historial de capturas de un renglón, con el autor de cada corrección. */
  COMPROBACION_HISTORIAL: (id: Id, idConsejo: Id, tipoConsejo: 'D' | 'M') =>
    `/material-electoral/comprobaciones/${id}/historial${qs({ idConsejo, tipoConsejo })}`,
  /** Captura de la cantidad física de un renglón. */
  COMPROBACION_CAPTURA: '/material-electoral/comprobaciones',

  /** Avance de todos los consejos del tipo; exclusivo de oficina central. */
  AVANCE_COMPROBACIONES: (tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/avance/comprobaciones${qs({ tipoConsejo, idEleccion })}`,

  /** Reporte en Excel de la comprobación de un consejo, renglón por renglón. */
  REPORTE_CONSEJO: (idConsejo: Id, tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/reportes/consejo${qs({ idConsejo, tipoConsejo, idEleccion })}`,
  /** Reporte en Excel del avance de todos los consejos del tipo. */
  REPORTE_GENERAL: (tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/reportes/general${qs({ tipoConsejo, idEleccion })}`,
  /** Reporte en Excel documento por documento de todos los consejos del tipo. */
  REPORTE_GENERAL_DETALLADO: (tipoConsejo: 'D' | 'M', idEleccion?: string) =>
    `/material-electoral/reportes/general-detallado${qs({ tipoConsejo, idEleccion })}`,
} as const;
