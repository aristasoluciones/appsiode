/** Llaves del catálogo de procesos electorales. */
export const PROCESOS_KEYS = {
  raiz: () => ['procesos'] as const,

  /** Listado completo del catálogo (pantalla de administración). */
  lista: () => ['procesos', 'lista'] as const,
} as const;
