import type { Id } from './_shared';

export const CATALOGOS = {
  PROCESO: (idProceso: Id) => `/Catalogos/proceso/${idProceso}`,
  SESIONES: '/Catalogos',
  LIST: (catalogos: string) => `/Catalogos?catalogos=${catalogos}`,
} as const;
