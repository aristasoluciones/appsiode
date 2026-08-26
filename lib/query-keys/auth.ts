/** Llaves de las pantallas de acceso y recuperación de contraseña. */
export const AUTH_KEYS = {
  raiz: () => ['auth'] as const,

  /** Validez del token que llega en el enlace de restablecimiento. */
  tokenReset: (token: string | null) => ['auth', 'token-reset', token] as const,

  /** Estado del segundo paso (MFA) de la propia cuenta. */
  mfaEstado: () => ['auth', 'mfa', 'estado'] as const,

  /** Sesiones abiertas de la propia cuenta. */
  sesiones: () => ['auth', 'sesiones'] as const,

  /** Equipos de confianza del segundo paso de la propia cuenta. */
  mfaDispositivos: () => ['auth', 'mfa', 'dispositivos'] as const,

  /** Página del historial de la propia cuenta. Sin argumentos invalida todas. */
  historial: (pagina?: number, tipo?: string | null) =>
    pagina == null
      ? (['auth', 'historial'] as const)
      : (['auth', 'historial', pagina, tipo] as const),
} as const;
