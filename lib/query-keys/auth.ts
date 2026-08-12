/** Llaves de las pantallas de acceso y recuperación de contraseña. */
export const AUTH_KEYS = {
  raiz: () => ['auth'] as const,

  /** Validez del token que llega en el enlace de restablecimiento. */
  tokenReset: (token: string | null) => ['auth', 'token-reset', token] as const,
} as const;
