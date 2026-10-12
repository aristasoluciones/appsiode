import { qs, type Id } from './_shared';

/**
 * Sistemas externos del proceso (SICE y RPP) consultados por el API, ya
 * filtrados por consejo y normalizados. `tipoConsejo` va en mayúscula (D o M).
 */
export const EXTERNOS = {
  /** Consejerías, presidencia y secretaría técnica del consejo según SICE. */
  INTEGRACION: (idConsejo: Id, tipoConsejo: 'D' | 'M') =>
    `/Externos/integracion${qs({ idConsejo, tipoConsejo })}`,
  /** Representaciones de partido aprobadas del consejo según RPP. */
  REPRESENTACIONES: (idConsejo: Id, tipoConsejo: 'D' | 'M') =>
    `/Externos/representaciones${qs({ idConsejo, tipoConsejo })}`,
} as const;
