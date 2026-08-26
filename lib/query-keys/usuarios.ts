import type { Id } from '@/lib/api/endpoints/_shared';

/** Llaves del módulo de usuarios. */
export const USUARIOS_KEYS = {
  raiz: () => ['usuarios'] as const,

  /** Carga combinada del formulario: usuarios + roles + consejos. */
  form: () => ['usuarios', 'form'] as const,

  /** Cuentas eliminadas: el listado las pide aparte y solo cuando se muestran. */
  eliminadas: () => ['usuarios', 'eliminadas'] as const,

  /** Estado del segundo paso (MFA) de todas las cuentas. */
  mfa: () => ['usuarios', 'mfa'] as const,

  /** Catálogo de tipos de evento del historial (común a todas las cuentas). */
  historialTipos: () => ['usuarios', 'historial-tipos'] as const,

  /** Página del historial de una cuenta. Sin argumentos invalida el historial completo. */
  historial: (idUsuario?: Id, pagina?: number, tipo?: string | null) =>
    idUsuario == null
      ? (['usuarios', 'historial'] as const)
      : (['usuarios', 'historial', String(idUsuario), pagina, tipo] as const),

  /** Sesiones abiertas de una cuenta. */
  sesiones: (idUsuario: Id) =>
    ['usuarios', 'sesiones', String(idUsuario)] as const,
} as const;
