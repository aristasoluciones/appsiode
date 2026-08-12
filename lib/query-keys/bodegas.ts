import type { KeyId } from './_shared';

/**
 * Llaves del módulo de bodegas.
 *
 * Las funciones sin argumentos (`listas`, `dashboards`, `fotografiasDeBodega`…)
 * devuelven prefijos pensados para invalidar de golpe todo un grupo.
 */
export const BODEGAS_KEYS = {
  raiz: () => ['bodegas'] as const,

  listas: () => ['bodegas', 'lista'] as const,
  lista: (tipo: string, tipoConsejo?: string, idConsejo?: number) =>
    ['bodegas', 'lista', tipo, tipoConsejo ?? 'all', idConsejo ?? 0] as const,

  detalle: (id: KeyId) => ['bodegas', 'detalle', id] as const,

  dashboards: () => ['bodegas', 'dashboard'] as const,
  dashboard: (tipo: string, tipoConsejo?: string) =>
    ['bodegas', 'dashboard', tipo, tipoConsejo ?? 'all'] as const,

  acuerdo: (idBodega: KeyId) => ['bodegas', 'acuerdo', idBodega] as const,

  /** Prefijo: todas las fotografías de una bodega, sin importar el filtro. */
  fotografiasDeBodega: (idBodega: KeyId) =>
    ['bodegas', 'fotografias', idBodega] as const,
  /** Filtro por componente/etapa o por categoría/momento, según la vista. */
  fotografias: (idBodega: KeyId, filtroA?: string, filtroB?: string) =>
    ['bodegas', 'fotografias', idBodega, filtroA, filtroB] as const,
  fotografiasConfig: () => ['bodegas', 'fotografias-config'] as const,

  observacionesDeBodega: (idBodega: KeyId) =>
    ['bodegas', 'observaciones', idBodega] as const,
  observaciones: (idBodega: KeyId, status?: string) =>
    ['bodegas', 'observaciones', idBodega, status ?? 'all'] as const,
} as const;

/** Llaves de las verificaciones, anidadas bajo la bodega a la que pertenecen. */
export const VERIFICACIONES_KEYS = {
  lista: (idBodega: KeyId) => ['bodegas', idBodega, 'verificaciones'] as const,
  detalle: (idBodega: KeyId, idVerificacion: KeyId) =>
    ['bodegas', idBodega, 'verificaciones', idVerificacion] as const,
  ultima: (idBodega: KeyId) => ['bodegas', idBodega, 'ultima-verificacion'] as const,
} as const;
