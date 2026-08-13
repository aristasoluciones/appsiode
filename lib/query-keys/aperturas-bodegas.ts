import type { KeyId } from './_shared';

/** Llaves del módulo de aperturas de bodega. */
export const APERTURAS_KEYS = {
  raiz: () => ['aperturas-bodegas'] as const,

  listas: () => ['aperturas-bodegas', 'lista'] as const,
  lista: (tipoConsejo: string, idConsejo: KeyId, tipoEleccion: string) =>
    ['aperturas-bodegas', 'lista', tipoConsejo, idConsejo, tipoEleccion] as const,

  resumenes: () => ['aperturas-bodegas', 'resumen'] as const,
  resumen: (tipoConsejo: string) =>
    ['aperturas-bodegas', 'resumen', tipoConsejo] as const,

  detalle: (id: KeyId) => ['aperturas-bodegas', 'detalle', id] as const,
  historial: (id: KeyId) => ['aperturas-bodegas', 'historial', id] as const,
} as const;
