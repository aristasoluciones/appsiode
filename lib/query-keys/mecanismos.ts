import type { KeyId } from './_shared';

/**
 * Llaves del módulo de mecanismos de recolección. Cada grupo tiene un prefijo
 * sin argumentos para invalidarlo completo tras una escritura.
 */
export const MECANISMOS_KEYS = {
  raiz: () => ['mecanismos'] as const,

  /* Catálogos: no cambian durante la sesión. */

  tipos: (incluirInactivos?: boolean) =>
    ['mecanismos', 'tipos', incluirInactivos ?? false] as const,
  marcoGeografico: () => ['mecanismos', 'marco-geografico'] as const,
  catalogosVerificacion: () =>
    ['mecanismos', 'catalogos-verificacion'] as const,

  /* Mecanismos: lista y detalle. */

  /** Prefijo de las listas y los detalles de mecanismos, para refrescarlos tras cualquier escritura. */
  mecanismos: () => ['mecanismos', 'lista'] as const,
  /** Lista según quién consulta y con qué filtros; oficina central sin consejo. */
  lista: (
    tipoConsejo: string,
    idConsejo: KeyId,
    idDf: KeyId,
    tipo: string,
    incluirInactivos: boolean,
  ) =>
    [
      'mecanismos',
      'lista',
      tipoConsejo,
      idConsejo,
      idDf,
      tipo,
      incluirInactivos,
    ] as const,
  /** Detalle de un mecanismo con consejos y casillas. */
  detalle: (id: KeyId) => ['mecanismos', 'lista', 'detalle', id] as const,

  /** Prefijo del seguimiento de oficina central. */
  seguimiento: () => ['mecanismos', 'seguimiento'] as const,
  seguimientoTipo: (tipoConsejo: string) =>
    ['mecanismos', 'seguimiento', tipoConsejo] as const,

  /* Importaciones: historial y detalle. */

  /** Prefijo del historial de importaciones, para refrescarlo tras una carga o una reversión. */
  importaciones: () => ['mecanismos', 'importaciones'] as const,
  /** Llave de las mutaciones de carga (revisar y aplicar), para saber si hay una en curso. */
  importacionesEnCurso: () =>
    ['mecanismos', 'importaciones', 'en-curso'] as const,
  importacionesTipo: (tipo: string) =>
    ['mecanismos', 'importaciones', tipo] as const,
  /** Una página del detalle de una importación; cuelga del mismo prefijo. */
  importacionDetalle: (id: KeyId, pagina: number) =>
    ['mecanismos', 'importaciones', 'detalle', id, pagina] as const,

  /* CAE. */

  /** Prefijo del catálogo de CAE, para refrescarlo tras una importación o una asignación. */
  caes: () => ['mecanismos', 'caes'] as const,
  caesLista: (
    tipoConsejo: string,
    idConsejo: KeyId,
    incluirInactivos: boolean,
  ) =>
    ['mecanismos', 'caes', tipoConsejo, idConsejo, incluirInactivos] as const,

  /* Configuración por consejo. */

  configuracion: () => ['mecanismos', 'configuracion'] as const,
  configuracionTipo: (tipoConsejo: string) =>
    ['mecanismos', 'configuracion', tipoConsejo] as const,

  /* Cédula: URL firmada del PDF de un mecanismo. */

  /** Prefijo de las URL firmadas de cédula, para retirarlas tras una carga o un zip. */
  cedulas: () => ['mecanismos', 'cedula'] as const,
  cedulaArchivo: (id: KeyId) => ['mecanismos', 'cedula', id] as const,

  /* Observaciones del informe. */

  /** Catálogo de tipos de observación; no cambia durante la sesión. */
  observacionesTipos: () => ['mecanismos', 'observaciones-tipos'] as const,

  /* Estudios de factibilidad. */

  /** Prefijo de los estudios (consejo, avance y detalle). */
  estudios: () => ['mecanismos', 'estudios'] as const,
  estudiosConsejo: (tipoConsejo: string, idConsejo: KeyId) =>
    ['mecanismos', 'estudios', 'consejo', tipoConsejo, idConsejo] as const,
  estudiosAvance: () => ['mecanismos', 'estudios', 'avance'] as const,
  estudio: (id: KeyId) => ['mecanismos', 'estudios', 'detalle', id] as const,
} as const;
