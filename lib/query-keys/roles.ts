import type { KeyId } from './_shared';

/** Llaves del módulo de roles y su matriz de permisos. */
export const ROLES_KEYS = {
  raiz: () => ['roles'] as const,

  lista: () => ['roles', 'lista'] as const,
  permisos: (idRol: KeyId) => ['roles', 'permisos', idRol] as const,
} as const;
