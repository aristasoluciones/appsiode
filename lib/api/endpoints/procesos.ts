import type { Id } from './_shared';

export const PROCESOS = {
  LIST: '/Procesos',
  CREATE: '/Procesos',
  UPDATE: (idProceso: Id) => `/Procesos/${idProceso}`,
} as const;
