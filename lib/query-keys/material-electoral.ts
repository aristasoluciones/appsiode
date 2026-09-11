import type { KeyId } from './_shared';

/** Llaves del módulo de documentación y material electoral. */
export const MATERIAL_ELECTORAL_KEYS = {
  raiz: () => ['material-electoral'] as const,

  /** Catálogo de tipos de documentación y material. */
  layoutTipos: (incluirInactivos?: boolean) =>
    ['material-electoral', 'layout-tipos', incluirInactivos ?? false] as const,

  /** Prefijo del historial de importaciones, para refrescarlo tras una carga o una reversión. */
  layoutImportaciones: () =>
    ['material-electoral', 'layout-importaciones'] as const,
  layoutImportacionesTipo: (tipoConsejo: string) =>
    ['material-electoral', 'layout-importaciones', tipoConsejo] as const,
  /** Una página del detalle de una importación; cuelga del mismo prefijo. */
  layoutImportacionDetalle: (id: KeyId, pagina: number) =>
    [
      'material-electoral',
      'layout-importaciones',
      'detalle',
      id,
      pagina,
    ] as const,

  /** Prefijo de las listas de comprobación, para invalidarlas todas tras una captura. */
  comprobaciones: () => ['material-electoral', 'comprobaciones'] as const,
  comprobacionesConsejo: (
    tipoConsejo: string,
    idConsejo: KeyId,
    idEleccion: string,
  ) =>
    [
      'material-electoral',
      'comprobaciones',
      tipoConsejo,
      idConsejo,
      idEleccion,
    ] as const,

  /** Historial de capturas de un renglón. */
  comprobacionHistorial: (tipoConsejo: string, idConsejo: KeyId, id: KeyId) =>
    [
      'material-electoral',
      'comprobacion-historial',
      tipoConsejo,
      idConsejo,
      id,
    ] as const,

  /** Prefijo del avance de oficina central, para invalidarlo tras una carga de layout. */
  avance: () => ['material-electoral', 'avance'] as const,
  avanceTipo: (tipoConsejo: string, idEleccion: string) =>
    ['material-electoral', 'avance', tipoConsejo, idEleccion] as const,

  /** Prefijo del catálogo de artículos, para refrescarlo tras cualquier escritura. */
  articulos: () => ['material-electoral', 'articulos'] as const,
  articulosLista: (incluirInactivos: boolean) =>
    ['material-electoral', 'articulos', incluirInactivos] as const,

  /**
   * URL firmadas de la fotografía de un artículo. La versión forma parte de la
   * llave: al reemplazar la foto cambia la versión y la miniatura se vuelve a pedir.
   */
  articuloImagenes: () => ['material-electoral', 'articulo-imagen'] as const,
  articuloImagen: (id: KeyId, version: number) =>
    ['material-electoral', 'articulo-imagen', id, version] as const,

  /** Prefijo de las actas circunstanciadas, para refrescarlas tras cualquier escritura. */
  actas: () => ['material-electoral', 'actas'] as const,
  /** Actas de un consejo con su borrador, bloqueo y pendientes. */
  actasConsejo: (tipoConsejo: string, idConsejo: KeyId) =>
    ['material-electoral', 'actas', 'consejo', tipoConsejo, idConsejo] as const,
  /** Resumen de oficina central por tipo de consejo. */
  actasResumen: (tipoConsejo: string) =>
    ['material-electoral', 'actas', 'resumen', tipoConsejo] as const,
  /** Detalle de un acta. */
  acta: (id: KeyId) => ['material-electoral', 'actas', 'detalle', id] as const,

  /** Configuración del acta (plantilla, apartados y versiones) del proceso de la sesión. */
  actasConfiguracion: () =>
    ['material-electoral', 'actas-configuracion'] as const,
  /** Catálogo de marcadores de la plantilla; no cambia durante la sesión. */
  actasMarcadores: () =>
    ['material-electoral', 'actas-configuracion', 'marcadores'] as const,
} as const;
