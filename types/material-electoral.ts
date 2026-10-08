/**
 * Carga del layout de documentación y material electoral.
 * Contrato de `/material-electoral/layouts` — el API responde en snake_case.
 */

/** Límites que impone el API a cada carga; se avisan también en pantalla. */
export const LAYOUT_LIMITES = {
  /** Tamaño máximo del archivo, en bytes. */
  bytes: 8 * 1024 * 1024,
  /** Máximo de renglones por archivo. */
  filas: 15000,
  /** Extensiones admitidas. */
  extensiones: ['.xlsx', '.csv'] as const,
} as const;

/** Tipo de documentación o material del catálogo (`cat.tipos_documentacion_material`). */
export interface ITipoDocumentacion {
  id: number;
  clave: string;
  descripcion: string;
  status?: string;
}

/** Renglón del archivo tal como lo revisó el API, para la vista previa. */
export interface ILayoutFila {
  fila: number;
  /** Código del artículo; en las filas rechazadas viene tal como se capturó. */
  codigo: string;
  /** Elección ya resuelta contra el catálogo: «GOB Gubernatura». */
  eleccion: string;
  /** Consejo ya resuelto contra el catálogo: «01 TUXTLA GUTIÉRREZ». */
  consejo: string;
  /** Tipo del artículo, tomado del catálogo: «DOCUMENTO Documentación electoral». */
  tipo: string;
  /** Descripción del artículo, tomada del catálogo; vacía si el código no se resolvió. */
  descripcion: string;
  version: string;
  cantidad: string;
  /** Paquetes o cajas en que se entrega la cantidad; opcional en el archivo. */
  paquetes_cajas: string;
  valida: boolean;
  errores: string[];
}

/** Renglones y piezas que trae el archivo para un consejo y una elección. */
export interface ILayoutResumenConsejo {
  consejo: string;
  eleccion: string;
  renglones: number;
  cantidad_total: number;
}

/**
 * Vista previa del layout antes de cargar nada. Un layout completo trae miles de
 * renglones: el API entrega los totales, el resumen por consejo y elección, las
 * filas rechazadas con su motivo y una muestra de las válidas.
 */
export interface ILayoutValidacion {
  tipo_consejo: string;
  total: number;
  validas: number;
  rechazadas: number;
  /** Consejos distintos que trae el archivo. */
  consejos: number;
  resumen: ILayoutResumenConsejo[];
  filas_rechazadas: ILayoutFila[];
  /** Filas rechazadas que no cupieron en la respuesta. */
  rechazadas_omitidas: number;
  muestra: ILayoutFila[];
}

/** Resultado de la carga: qué renglones se crearon, se actualizaron y se omitieron. */
export interface ILayoutResultado {
  /** Registro de la carga en el historial de importaciones. */
  id_importacion?: number;
  total: number;
  insertados: number;
  actualizados: number;
  /** Renglones conservados porque el consejo ya capturó su cantidad física. */
  omitidos_comprobados: number;
  /** Renglones que ya existían más de una vez y no se pueden actualizar sin ambigüedad. */
  omitidos_duplicados: number;
}

/* -------------------------------------------------------------------------- */
/* Historial de importaciones del layout                                      */
/* Contrato de `/material-electoral/layouts/importaciones` — snake_case.      */
/* -------------------------------------------------------------------------- */

/** Estatus de una importación; la reversión lo cambia a REVERTIDA. */
export type TEstatusImportacion = 'APLICADA' | 'REVERTIDA';

/** Una carga del layout registrada en el historial, con su autor y su reversión si la hubo. */
export interface ILayoutImportacion {
  id: number;
  tipo_consejo: 'D' | 'M';
  archivo: string;
  renglones: number;
  nuevos: number;
  actualizados: number;
  omitidos: number;
  estatus: TEstatusImportacion;
  fecha_registro: string;
  id_usuario: number | null;
  usuario: string | null;
  fecha_reversion: string | null;
  id_usuario_reversion: number | null;
  usuario_reversion: string | null;
  motivo_reversion: string | null;
  /** Solo la importación aplicada más reciente del tipo de consejo se puede revertir. */
  reversible: boolean;
}

/** Qué hizo la importación con el renglón. */
export type TAccionImportacion = 'NUEVO' | 'ACTUALIZADO';

/**
 * Renglón que tocó una importación, con los valores que tenía antes y los que
 * tiene ahora. Los «anteriores» vienen en null en los renglones nuevos; los
 * «actuales» en null cuando la carga ya se revirtió y el renglón nuevo se borró.
 */
export interface ILayoutImportacionRenglon {
  id_renglon: number;
  id_consejo: number;
  consejo: string;
  id_eleccion: string;
  id_articulo: number;
  codigo: string;
  descripcion_articulo: string;
  accion: TAccionImportacion;
  tipo_doc_anterior: string | null;
  desc_documento_anterior: string | null;
  version_anterior: string | null;
  cantidad_anterior: number | null;
  paquetes_cajas_anterior: number | null;
  tipo_doc_actual: string | null;
  desc_documento_actual: string | null;
  version_actual: string | null;
  cantidad_actual: number | null;
  paquetes_cajas_actual: number | null;
  cantidad_fisica: number | null;
  /** El renglón sigue existiendo en la base. */
  existe: boolean;
}

/** Detalle de una importación: su encabezado y los renglones que tocó, por páginas. */
export interface ILayoutImportacionDetalle {
  importacion: ILayoutImportacion;
  total_detalle: number;
  pagina: number;
  por_pagina: number;
  detalle: ILayoutImportacionRenglon[];
}

/** Motivo obligatorio de la reversión; el API exige entre 5 y 500 caracteres. */
export interface ILayoutImportacionRevertirPayload {
  id: number;
  motivo: string;
}

/** Resultado de la reversión: documentos borrados y regresados a sus valores anteriores. */
export interface ILayoutReversion {
  id: number;
  eliminados: number;
  restaurados: number;
}

/* -------------------------------------------------------------------------- */
/* Comprobación física por consejo                                            */
/* Contrato de `/material-electoral/comprobaciones` — snake_case del API.      */
/* -------------------------------------------------------------------------- */

/** Estatus del renglón; lo calcula la base, nunca la pantalla. */
export type TEstatusComprobacion =
  | 'SIN_INFORMACION'
  | 'SIN_INCONSISTENCIAS'
  | 'CON_FALTANTES'
  | 'CON_EXCEDENTES';

/** Elección activa del proceso aplicable al tipo de consejo, con su avance. */
export interface IComprobacionEleccion {
  clave: string;
  descripcion: string;
  total: number;
  capturados: number;
}

/** Avance del consejo; `completo` es la condición para generar el acta. */
export interface IComprobacionResumen {
  total: number;
  capturados: number;
  sin_informacion: number;
  sin_inconsistencias: number;
  con_faltantes: number;
  con_excedentes: number;
  porcentaje: number;
  completo: boolean;
}

/** Renglón de documentación o material con su comprobación. */
export interface IComprobacionDocumento {
  /** Identificador del renglón documento-consejo (no la clave del catálogo). */
  id: number;
  /** Artículo del catálogo al que está ligado el renglón y su código. */
  id_articulo: number;
  codigo: string;
  /**
   * Fotografía del artículo: URL firmadas de solo lectura, vigentes 24 horas.
   * Solo vienen cuando el artículo tiene fotografía; sin ella no viaja ninguna.
   */
  imagen_url?: string;
  miniatura_url?: string;
  id_eleccion: string;
  desc_eleccion: string;
  /** Tipo y descripción copiados del artículo al cargar; no cambian con el catálogo. */
  tipo_doc: string;
  desc_tipo: string | null;
  desc_documento: string;
  version: string | null;
  /** Cantidad entregada por la oficina central. */
  cantidad: number | null;
  /** Paquetes o cajas en que se entregó la cantidad; null si no se capturó en el layout. */
  numero_paquetes_cajas: number | null;
  /** Cantidad contada por el consejo; null mientras no captura. */
  cantidad_fisica: number | null;
  diferencia: number | null;
  /** Faltante en positivo (la diferencia negativa); null si no falta nada. */
  faltantes?: number | null;
  /** Folios de las boletas comprobadas; solo en renglones de tipo BOLETA. */
  folio_inicial?: number | null;
  folio_final?: number | null;
  estatus: TEstatusComprobacion;
  observaciones: string | null;
  fecha_registro: string | null;
  /** Capturas acumuladas del renglón (correcciones incluidas). */
  capturas: number;
}

/** Respuesta de la lista de comprobación de un consejo. */
export interface IComprobacionesData {
  id_consejo: number;
  tipo_consejo: 'D' | 'M';
  elecciones: IComprobacionEleccion[];
  resumen: IComprobacionResumen;
  documentos: IComprobacionDocumento[];
}

/** Captura de la cantidad física de un renglón. */
export interface IComprobacionCapturaPayload {
  id: number;
  id_consejo: number;
  tipo_consejo: 'D' | 'M';
  cantidad_fisica: number;
  /** Obligatorias cuando la cantidad física no coincide con la entregada. */
  observaciones: string;
  /** Solo boletas: obligatorios, de uno o más, y el final no menor al inicial. */
  folio_inicial?: number;
  folio_final?: number;
}

/**
 * Lo que devuelve la captura: el renglón actualizado y, además, si el consejo
 * tiene comprobaciones que ningún acta aceptada ampara, para sugerir un acta.
 */
export interface IComprobacionCapturaResultado {
  id: number;
  cantidad_fisica: number | null;
  diferencia: number | null;
  estatus: TEstatusComprobacion;
  acta_pendiente: boolean;
  acta_pendientes: number;
}

/** Naturaleza de cada hito de la línea de tiempo del renglón. */
export type TComprobacionEventoTipo =
  | 'CARGA_INICIAL'
  | 'ACTUALIZACION'
  | 'COMPROBACION';

/**
 * Un hito del renglón: su alta con el layout, un cambio posterior de la
 * cantidad entregada o una comprobación física del consejo. Los campos que no
 * corresponden al tipo de evento vienen en null.
 */
export interface IComprobacionEvento {
  tipo: TComprobacionEventoTipo;
  /** Nombre del evento tal como se muestra en pantalla. */
  evento: string;
  fecha: string;
  id_usuario: number | null;
  usuario: string | null;
  /** Importación que originó el evento; solo en carga inicial y actualización. */
  id_importacion: number | null;
  archivo: string | null;
  /** Cantidad entregada con la que quedó el renglón tras el evento. */
  cantidad: number | null;
  /** Cantidad entregada previa; solo en las actualizaciones. */
  cantidad_anterior: number | null;
  /** Datos de la comprobación física. */
  id_captura: number | null;
  cantidad_fisica: number | null;
  diferencia: number | null;
  /** Folios de las boletas de esa comprobación; null en los demás tipos. */
  folio_inicial?: number | null;
  folio_final?: number | null;
  observaciones: string | null;
  vigente: boolean | null;
}

/** Historial de un renglón: su origen y cada comprobación física. */
export interface IComprobacionHistorial {
  id: number;
  id_articulo: number;
  codigo: string;
  /** Fotografía del artículo; solo cuando existe (ver `IComprobacionDocumento`). */
  imagen_url?: string;
  miniatura_url?: string;
  id_eleccion: string;
  tipo_doc: string;
  desc_documento: string;
  version: string | null;
  cantidad: number | null;
  numero_paquetes_cajas: number | null;
  cantidad_fisica: number | null;
  diferencia: number | null;
  /** Importación que dio de alta el renglón; null en los renglones heredados. */
  id_importacion: number | null;
  /** Línea de tiempo completa, del evento más reciente al más antiguo. */
  eventos: IComprobacionEvento[];
}

/* -------------------------------------------------------------------------- */
/* Seguimiento de oficina central                                             */
/* Contrato de `/material-electoral/avance/comprobaciones` — snake_case.      */
/* -------------------------------------------------------------------------- */

/** Avance de un consejo. Vienen todos los del tipo, aunque no tengan layout cargado. */
export interface IAvanceConsejo {
  tipo_consejo: 'D' | 'M';
  id_consejo: number;
  nombre_consejo: string;
  total: number;
  capturados: number;
  sin_informacion: number;
  sin_inconsistencias: number;
  /** Faltantes más excedentes; la definición está pendiente de cerrar con la DEOE. */
  con_inconsistencias: number;
  con_faltantes: number;
  con_excedentes: number;
  porcentaje: number;
  /** El consejo capturó todos sus renglones: condición para el acta. */
  completo: boolean;
  ultima_captura: string | null;
}

/** Totales del estado y cuántos consejos terminaron su captura. */
export interface IAvanceResumen {
  consejos: number;
  consejos_completos: number;
  /** Consejos sin un solo renglón cargado. */
  consejos_sin_layout: number;
  total: number;
  capturados: number;
  sin_informacion: number;
  sin_inconsistencias: number;
  con_inconsistencias: number;
  con_faltantes: number;
  con_excedentes: number;
  porcentaje: number;
}

/** Respuesta del avance por consejo que consulta la oficina central. */
export interface IAvanceComprobaciones {
  tipo_consejo: 'D' | 'M';
  elecciones: IComprobacionEleccion[];
  resumen: IAvanceResumen;
  consejos: IAvanceConsejo[];
}

/** Reportes en Excel que genera el API para la oficina central. */
export type TReporteComprobacion = 'consejo' | 'general' | 'general-detallado';

/* -------------------------------------------------------------------------- */
/* Catálogo de artículos                                                      */
/* Contrato de `/material-electoral/articulos` — snake_case del API.          */
/* -------------------------------------------------------------------------- */

/** Límites que impone el API al catálogo y a sus importaciones; se avisan también en pantalla. */
export const ARTICULOS_LIMITES = {
  /** Reglas del código: sin espacios ni signos que estorben en el formato de captura. */
  codigo: { max: 50, patron: /^[A-Za-z0-9._/-]+$/ },
  descripcion: { max: 500 },
  /** Fotografía individual y cada imagen del zip. */
  foto: {
    bytes: 5 * 1024 * 1024,
    tipos: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  /** Archivo de importación del catálogo. */
  importacion: {
    bytes: 4 * 1024 * 1024,
    filas: 2000,
    extensiones: ['.xlsx', '.csv'] as const,
  },
  /** Zip de fotografías. */
  zip: {
    bytes: 100 * 1024 * 1024,
    archivos: 500,
    extensiones: ['.zip'] as const,
  },
} as const;

/** Artículo del catálogo con su uso en las cargas del layout. */
export interface IArticulo {
  id: number;
  codigo: string;
  descripcion: string;
  /** Clave del tipo: DOCUMENTO, MATERIAL o BOLETA. */
  tipo: string;
  desc_tipo: string | null;
  /** Nombre del archivo de la fotografía; null cuando no tiene. */
  imagen: string | null;
  imagen_version: number;
  activo: boolean;
  /** Renglones cargados y cargas del layout en que aparece. */
  renglones: number;
  cargas: number;
  /** Un artículo usado no cambia de código; al editarlo el cambio aplica solo a cargas nuevas. */
  usado: boolean;
}

/** Alta y edición: el código queda fijo en cuanto el artículo se usa en una carga. */
export interface IArticuloPayload {
  codigo: string;
  descripcion: string;
  tipo: string;
}

/** URL firmadas de la fotografía y su miniatura; vigentes 24 horas. */
export interface IArticuloImagenUrls {
  imagen: string | null;
  miniatura: string | null;
  imagen_version: number;
}

/** Qué hará la importación con un renglón del archivo. */
export type TArticuloEfecto = 'NUEVO' | 'ACTUALIZA' | 'SIN_CAMBIOS';

/** Renglón del archivo de artículos tal como lo revisó el API. */
export interface IArticuloFila {
  fila: number;
  codigo: string;
  descripcion: string;
  /** Tipo ya resuelto contra el catálogo: «DOCUMENTO Documentación electoral». */
  tipo: string;
  efecto: TArticuloEfecto | '';
  valida: boolean;
  errores: string[];
}

/** Vista previa de la importación del catálogo: qué se crearía, qué cambiaría y qué renglones traen observaciones. */
export interface IArticulosValidacion {
  total: number;
  validas: number;
  rechazadas: number;
  nuevos: number;
  actualizados: number;
  sin_cambios: number;
  filas_rechazadas: IArticuloFila[];
  /** Renglones rechazados que no cupieron en la respuesta. */
  rechazadas_omitidas: number;
  muestra: IArticuloFila[];
}

/** Resultado de importar el catálogo. */
export interface IArticulosImportacionResultado {
  total: number;
  nuevos: number;
  actualizados: number;
  sin_cambios: number;
}

/** Archivo del zip que corresponde a un artículo del catálogo. */
export interface IFotografiaCoincidencia {
  archivo: string;
  id_articulo: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
  /** El artículo ya tenía fotografía y esta la reemplaza. */
  reemplaza: boolean;
}

/** Archivo del zip que no se aplicará, con el motivo. */
export interface IFotografiaObservacion {
  archivo: string;
  motivo: string;
}

/** Artículo activo que seguiría sin fotografía después de aplicar el zip. */
export interface IArticuloSinFotografia {
  id_articulo: number;
  codigo: string;
  descripcion: string;
}

/** Vista previa de la importación de fotografías antes de cambiar nada. */
export interface IArticulosFotografiasValidacion {
  total_archivos: number;
  coincidencias: IFotografiaCoincidencia[];
  reemplazos: number;
  sin_articulo: IFotografiaObservacion[];
  invalidos: IFotografiaObservacion[];
  articulos_sin_fotografia: IArticuloSinFotografia[];
  /** Carpetas y archivos del sistema dentro del zip que se pasan por alto. */
  omitidos: number;
}

/** Resultado de aplicar el zip: cuántas fotografías quedaron y cuáles fallaron. */
export interface IArticulosFotografiasResultado {
  aplicadas: number;
  reemplazadas: number;
  fallidas: IFotografiaObservacion[];
  sin_articulo: number;
  invalidos: number;
  articulos_sin_fotografia: number;
}

/* -------------------------------------------------------------------------- */
/* Actas circunstanciadas                                                     */
/* Contrato de `/material-electoral/actas` — snake_case del API.              */
/* -------------------------------------------------------------------------- */

/** Límites que impone el API a los archivos del acta; se avisan también en pantalla. */
export const ACTA_LIMITES = {
  /** Fotografía de cada apartado. */
  foto: {
    bytes: 5 * 1024 * 1024,
    tipos: ['image/jpeg', 'image/png', 'image/webp'] as const,
    /** Máximo por apartado. */
    porApartado: 50,
  },
  /** PDF firmado. */
  firmada: { bytes: 20 * 1024 * 1024, tipos: ['application/pdf'] as const },
  ciudad: { max: 150 },
  lugar: { max: 500 },
  motivo: { max: 2000 },
  /** Observaciones de la revisión de oficina central. */
  observaciones: { max: 4000 },
  /** Plantilla Word de la configuración. */
  plantilla: {
    bytes: 10 * 1024 * 1024,
    tipos: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ] as const,
  },
  /** Apartados de fotografías de la configuración. */
  apartado: {
    titulo: { max: 150 },
    descripcion: { max: 500 },
    minimo: { min: 0, max: 50 },
    /** Apartados por configuración. */
    maximo: 30,
  },
} as const;

/**
 * Ciclo del acta, vigilado desde la base: Borrador → Generada → En revisión ⇄
 * Requerido → Aceptada → Anulada; Descartada desde cualquiera no aceptada.
 */
export type TEstatusActa =
  | 'BORRADOR'
  | 'GENERADA'
  | 'EN_REVISION'
  | 'REQUERIDO'
  | 'ACEPTADA'
  | 'ANULADA'
  | 'DESCARTADA';

/** Persona que interviene en el acta, calcada de las aperturas de bodega. */
export type TTipoParticipanteActa =
  | 'PRESIDENCIA'
  | 'SECRETARIA'
  | 'CONSEJERIA'
  | 'REPRESENTACION';

/** Participante tal como viaja al generar y como lo devuelve el detalle. */
export interface IActaParticipante {
  id?: number;
  tipo: TTipoParticipanteActa;
  orden?: number;
  nombre: string;
  cargo?: string | null;
  id_partido?: number | null;
  partido?: string | null;
  /** Ruta del logotipo del partido en el RPP; se guarda con el acta para no depender de ese servicio al leerla. */
  imagen?: string | null;
  asistencia: boolean;
}

/** Apartado de fotografías de la configuración vigente, con el avance del acta. */
export interface IActaApartado {
  clave: string;
  titulo: string;
  descripcion: string | null;
  minimo: number;
  orden: number;
  activo: boolean;
  /** Fotografías que ya tiene el acta en este apartado. */
  fotografias: number;
  /** Cumple el mínimo. */
  completo: boolean;
}

/** Fotografía del acta con sus URL firmadas (2 horas). */
export interface IActaFotografia {
  id: number;
  apartado: string;
  archivo: string;
  orden: number;
  fecha_registro?: string;
  imagen_url: string | null;
  miniatura_url: string | null;
}

/** Renglón congelado al corte: comprobación que entró en el acta. */
export interface IActaRenglon {
  id: number;
  id_documento: number;
  id_articulo: number;
  codigo: string;
  id_eleccion: string;
  desc_eleccion: string | null;
  tipo_doc: string;
  desc_tipo: string | null;
  desc_documento: string;
  version: string | null;
  numero_paquetes_cajas: number | null;
  cantidad: number | null;
  cantidad_fisica: number | null;
  diferencia: number | null;
  /** Faltante en positivo (la diferencia negativa); null si no falta nada. */
  faltantes?: number | null;
  /** Folios de las boletas del renglón; null en los demás tipos. */
  folio_inicial?: number | null;
  folio_final?: number | null;
  fecha_comprobacion: string | null;
}

/** Movimiento del historial del acta; las observaciones solo se agregan. */
export interface IActaObservacion {
  id: number;
  estatus_anterior: TEstatusActa | null;
  estatus_nuevo: TEstatusActa;
  estatus_nuevo_desc: string;
  observaciones: string | null;
  id_usuario: number | null;
  usuario: string | null;
  fecha_registro: string;
}

/** Acta en el listado del consejo, de la más reciente a la más antigua. */
export interface IActaResumen {
  id: number;
  estatus: TEstatusActa;
  estatus_desc: string;
  fecha_acta: string | null;
  hora_acta: string | null;
  ciudad: string | null;
  lugar: string | null;
  fecha_corte: string | null;
  id_usuario_genero: number | null;
  usuario_genero: string | null;
  fecha_generacion: string | null;
  archivo_generado: string | null;
  archivo_firmado: string | null;
  fecha_firmado: string | null;
  id_acta_sustituida: number | null;
  motivo_cierre: string | null;
  fecha_cierre: string | null;
  created_at: string;
  updated_at: string | null;
  renglones: number;
  fotografias: number;
  /** Veces que oficina central la regresó con observaciones. */
  ciclos_revision: number;
  /** Tipos de artículo del acta; ausente en las anteriores al filtro. */
  tipos_articulo?: IActaTipoArticulo[] | null;
}

/** Detalle completo del acta (también lo devuelven el borrador y cada escritura). */
export interface IActa {
  id: number;
  id_proceso: number;
  id_consejo: number;
  tipo_consejo: 'D' | 'M';
  consejo: string | null;
  estatus: TEstatusActa;
  estatus_desc: string;
  editable: boolean;
  puede_firmar: boolean;
  puede_descartar: boolean;
  puede_revisar: boolean;
  puede_anular: boolean;
  fecha_acta: string | null;
  hora_acta: string | null;
  ciudad: string | null;
  lugar: string | null;
  fecha_corte: string | null;
  /**
   * Tipos de artículo que el consejo eligió para el acta; junto con el corte
   * filtran los renglones. Vacío o ausente en actas anteriores a este filtro.
   */
  tipos_articulo?: IActaTipoArticulo[] | null;
  id_usuario_genero: number | null;
  usuario_genero: string | null;
  fecha_generacion: string | null;
  archivo_generado: string | null;
  archivo_firmado: string | null;
  fecha_firmado: string | null;
  id_acta_sustituida: number | null;
  motivo_cierre: string | null;
  id_usuario_cierre: number | null;
  usuario_cierre: string | null;
  fecha_cierre: string | null;
  created_at: string;
  updated_at: string | null;
  configuracion: {
    id: number;
    version: number;
    plantilla: string | null;
    plantilla_version: number | null;
    apartados: IActaApartado[];
  };
  participantes: IActaParticipante[];
  renglones: IActaRenglon[];
  observaciones: IActaObservacion[];
  fotografias: IActaFotografia[];
  /** Avisos que no impiden capturar el acta; solo los trae un borrador. */
  advertencias?: IActaAdvertencia[];
  /** Traslado de la documentación y el material; null mientras no se captura. */
  vehiculo?: IActaVehiculo | null;
  custodia?: IActaCustodia | null;
}

/** Aviso no bloqueante de un borrador, p. ej. tipos elegidos sin comprobaciones nuevas desde el último corte. */
export interface IActaAdvertencia {
  codigo: 'SIN_COMPROBACIONES' | 'TIPOS_SIN_COMPROBACIONES' | (string & {});
  mensaje: string;
}

/** Borrador del consejo en el listado: reserva sus tipos de artículo desde que se crea. */
export interface IActaBorrador {
  id: number;
  created_at: string;
  tipos_articulo: IActaTipoArticulo[] | null;
  fotografias: number;
  /** Avisos que no impiden capturar el acta. */
  advertencias?: IActaAdvertencia[];
}

/** Tipo de artículo que ya está en otra acta en curso, con el acta que lo tiene. */
export interface IActaTipoOcupado {
  clave: string;
  descripcion: string | null;
  id_acta: number;
  estatus: TEstatusActa;
}

/** Respuesta del listado de actas de un consejo. */
export interface IActasConsejo {
  consejo: { id_consejo: number; tipo_consejo: 'D' | 'M'; consejo: string };
  actas: IActaResumen[];
  /** Borradores abiertos del consejo, del más reciente al más antiguo. */
  borradores: IActaBorrador[];
  /** Tipos de artículo tomados por un acta en curso (borrador, generada, en revisión o requerida). */
  tipos_ocupados: IActaTipoOcupado[];
  /** Motivo por el que no se puede generar; null cuando sí se puede. */
  bloqueo: string | null;
  configuracion_lista: boolean;
  /** Renglones comprobados que ningún acta aceptada ampara. */
  pendientes: number;
}

/** Datos del generador: sirven para la vista previa, generar y regenerar. */
export interface IActaGenerarPayload {
  id_acta?: number;
  /** yyyy-MM-dd */
  fecha_acta: string;
  /** HH:mm */
  hora_acta: string;
  ciudad: string;
  lugar: string;
  participantes: IActaParticipante[];
  /** Claves de tipo de artículo (DOCUMENTO, BOLETA, MATERIAL…) que entran al acta; al menos una. */
  tipos_articulo: string[];
  vehiculo: IActaVehiculo;
  custodia: IActaCustodia;
  /** Confirma generar aunque al corte no haya comprobaciones nuevas. */
  confirmar_sin_renglones?: boolean;
}

/** Vehículo en que se trasladan la documentación y el material; todo obligatorio salvo el número económico. */
export interface IActaVehiculo {
  tipo: string;
  marca: string;
  modelo: string;
  /** Placas del vehículo: alfanumérico, con guiones, hasta 15 caracteres. */
  placas: string;
  numero_economico?: string | null;
  numero_tarjeta_circulacion: string;
  conductor: string;
  /** Clave de elector del conductor: 18 caracteres alfanuméricos. */
  clave_credencial: string;
}

/**
 * Custodia del traslado. Con `custodiado` verdadero, el resto es obligatorio;
 * sin custodia solo viaja `{ custodiado: false }`.
 */
export interface IActaCustodia {
  custodiado: boolean;
  corporacion?: string | null;
  /** Alfanumérico, hasta 20 caracteres. */
  numero_patrulla?: string | null;
  /** De 1 a 99. */
  numero_elementos?: number | null;
  conductor_nombre?: string | null;
  conductor_identificacion?: string | null;
}

/** Tipo de artículo elegido para el acta, con su descripción del catálogo. */
export interface IActaTipoArticulo {
  clave: string;
  descripcion: string | null;
}

/** Respuesta al subir una fotografía: la foto y el avance por apartado. */
export interface IActaFotografiaSubida extends IActaFotografia {
  id_acta: number;
  apartados: IActaApartado[];
}

/** Respuesta al quitar una fotografía. */
export interface IActaFotografiaEliminada {
  id: number;
  id_acta: number;
  apartado: string;
  archivo: string;
  apartados: IActaApartado[];
}

/** Consejo en el resumen de oficina central; vienen todos, aunque en ceros. */
export interface IActasResumenConsejo {
  tipo_consejo: 'D' | 'M';
  id_consejo: number;
  consejo: string;
  total: number;
  generadas: number;
  en_revision: number;
  requeridas: number;
  aceptadas: number;
  anuladas: number;
  descartadas: number;
  con_borrador: boolean;
  ultima_generacion: string | null;
}

/** Resumen de actas por tipo de consejo que consulta la oficina central. */
export interface IActasResumen {
  tipo_consejo: 'D' | 'M';
  configuracion_lista: boolean;
  totales: {
    consejos: number;
    con_actas: number;
    total: number;
    generadas: number;
    en_revision: number;
    requeridas: number;
    aceptadas: number;
    anuladas: number;
    descartadas: number;
  };
  consejos: IActasResumenConsejo[];
}

/* -------------------------------------------------------------------------- */
/* Configuración del acta circunstanciada                                     */
/* Contrato de `/material-electoral/actas/configuracion` — solo oficina central. */
/* -------------------------------------------------------------------------- */

/** Apartado de fotografías tal como lo devuelve la configuración; `id` es nulo en los apartados por defecto. */
export interface IActaConfiguracionApartado {
  id: number | null;
  clave: string;
  titulo: string;
  descripcion: string | null;
  minimo: number;
  orden: number;
  activo: boolean;
}

/** Versión de la configuración; cada cambio de plantilla o de apartados crea una. */
export interface IActaConfiguracionVersion {
  id: number;
  version: number;
  cambio: 'INICIAL' | 'PLANTILLA' | 'APARTADOS';
  plantilla: string | null;
  plantilla_nombre: string | null;
  plantilla_version: number | null;
  vigente: boolean;
  fecha_registro: string;
  id_usuario: number | null;
  usuario: string | null;
  /** Actas que se generaron con esta versión. */
  actas: number;
}

/** Configuración vigente del acta del proceso de la sesión. */
export interface IActaConfiguracion {
  /** Nulo mientras el proceso no tiene ninguna versión guardada. */
  id: number | null;
  version: number | null;
  /** Ya hay plantilla: los consejos pueden generar actas. */
  lista: boolean;
  plantilla: string | null;
  plantilla_nombre: string | null;
  plantilla_version: number;
  fecha_registro: string | null;
  id_usuario: number | null;
  usuario: string | null;
  apartados: IActaConfiguracionApartado[];
  versiones: IActaConfiguracionVersion[];
}

/** Marcador que la plantilla Word puede traer y que el sistema llena al generar. */
export interface IActaMarcador {
  marcador: string;
  /** TEXTO se sustituye en línea; TABLA y FOTOGRAFIAS ocupan un párrafo propio. */
  tipo: 'TEXTO' | 'TABLA' | 'FOTOGRAFIAS';
  obligatorio: boolean;
  descripcion: string;
  ejemplo: string;
}

/** Resultado de revisar una plantilla: qué trae, qué obligatorio falta y qué está mal ubicado. */
export interface IActaPlantillaValidacion {
  valida: boolean;
  encontrados: string[];
  faltantes: string[];
  desconocidos: string[];
  errores: string[];
}

/** Apartado tal como viaja al guardar; sin `clave` el servidor asigna una nueva. */
export interface IActaApartadoPayload {
  clave?: string | null;
  titulo: string;
  descripcion?: string | null;
  minimo: number;
  activo: boolean;
}
