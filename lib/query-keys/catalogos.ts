/** Llaves de los catálogos del API — datos estables que se cachean por largo tiempo. */
export const CATALOGOS_KEYS = {
  raiz: () => ['catalogos'] as const,

  sesiones: () => ['catalogos', 'sesiones'] as const,
  aperturas: () => ['catalogos', 'aperturas-bodegas'] as const,
  tiposDocumentos: () => ['catalogos', 'tipos-documentos'] as const,
  incidencias: () => ['catalogos', 'incidencias'] as const,
} as const;
