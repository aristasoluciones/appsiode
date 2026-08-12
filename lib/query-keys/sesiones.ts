import type { KeyId } from './_shared';

/** Llaves del módulo de sesiones (tablero de indicadores, sesiones por consejo y detalle). */
export const SESIONES_KEYS = {
  raiz: () => ['sesiones'] as const,

  indicadoresTodos: () => ['sesiones', 'indicadores'] as const,
  indicadores: (tipoConsejo: string, sesionId: string | null) =>
    ['sesiones', 'indicadores', tipoConsejo, sesionId] as const,

  opcionesTodas: () => ['sesiones', 'opciones'] as const,
  opciones: (tipoConsejo: string) => ['sesiones', 'opciones', tipoConsejo] as const,

  consejo: (tipoConsejo: string, idConsejo: KeyId) =>
    ['sesiones', 'consejo', tipoConsejo, idConsejo] as const,

  detalle: (idSesion: KeyId) => ['sesiones', 'detalle', idSesion] as const,
  votos: (idSesion: KeyId) => ['sesiones', 'votos', idSesion] as const,
  expedientes: (idSesion: KeyId) => ['sesiones', 'expedientes', idSesion] as const,
  incidencias: (idSesion: KeyId) => ['sesiones', 'incidencias', idSesion] as const,
} as const;
