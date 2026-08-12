import type { KeyId } from './_shared';

/**
 * Llaves de los servicios externos que se consultan desde el frontend
 * (integración SICE y representaciones de partidos políticos).
 */
export const EXTERNOS_KEYS = {
  raiz: () => ['externos'] as const,

  /** Consejeros electorales publicados por SICE. */
  integracionSice: (tipoConsejo: string | null, claveConsejo: KeyId | null) =>
    ['externos', 'integracion-sice', tipoConsejo, claveConsejo] as const,

  /** Representaciones de partidos para la vista de sesiones. */
  representantes: (tipo: string, idConsejo: KeyId | null) =>
    ['externos', 'representantes-pp', tipo, idConsejo] as const,

  /** Representaciones de partidos para la vista de aperturas de bodega. */
  representantesApertura: (tipo: string | null, idConsejo: KeyId | null) =>
    ['externos', 'representantes-pp-apertura', tipo, idConsejo] as const,
} as const;
