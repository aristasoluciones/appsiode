import type { KeyId } from './_shared';

/**
 * Llaves de los sistemas externos que consulta el API (SICE y RPP): la
 * integración del consejo y sus representaciones de partido.
 */
export const EXTERNOS_KEYS = {
  raiz: () => ['externos'] as const,

  /** Consejerías, presidencia y secretaría técnica del consejo (SICE). */
  integracion: (tipoConsejo: string | null, idConsejo: KeyId | null) =>
    ['externos', 'integracion', tipoConsejo, idConsejo] as const,

  /** Representaciones de partido aprobadas del consejo (RPP). */
  representaciones: (tipoConsejo: string | null, idConsejo: KeyId | null) =>
    ['externos', 'representaciones', tipoConsejo, idConsejo] as const,
} as const;
