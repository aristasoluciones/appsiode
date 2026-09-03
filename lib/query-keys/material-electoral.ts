import type { KeyId } from './_shared';

/** Llaves del módulo de documentación y material electoral. */
export const MATERIAL_ELECTORAL_KEYS = {
  raiz: () => ['material-electoral'] as const,

  /** Catálogo de tipos de documentación y material. */
  layoutTipos: (incluirInactivos?: boolean) =>
    ['material-electoral', 'layout-tipos', incluirInactivos ?? false] as const,

  /** Prefijo de las listas de comprobación, para invalidarlas todas tras una captura. */
  comprobaciones: () => ['material-electoral', 'comprobaciones'] as const,
  comprobacionesConsejo: (
    tipoConsejo: string,
    idConsejo: KeyId,
    idEleccion: string,
  ) =>
    [
      'material-electoral',
      'comprobaciones',
      tipoConsejo,
      idConsejo,
      idEleccion,
    ] as const,

  /** Historial de capturas de un renglón. */
  comprobacionHistorial: (tipoConsejo: string, idConsejo: KeyId, id: KeyId) =>
    [
      'material-electoral',
      'comprobacion-historial',
      tipoConsejo,
      idConsejo,
      id,
    ] as const,

  /** Prefijo del avance de oficina central, para invalidarlo tras una carga de layout. */
  avance: () => ['material-electoral', 'avance'] as const,
  avanceTipo: (tipoConsejo: string, idEleccion: string) =>
    ['material-electoral', 'avance', tipoConsejo, idEleccion] as const,
} as const;
