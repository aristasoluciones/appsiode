/** Llaves del módulo de usuarios. */
export const USUARIOS_KEYS = {
  raiz: () => ['usuarios'] as const,

  /** Carga combinada del formulario: usuarios + roles + consejos. */
  form: () => ['usuarios', 'form'] as const,
} as const;
