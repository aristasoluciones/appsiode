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
  id_documento: string;
  /** Elección ya resuelta contra el catálogo: «GOB Gubernatura». */
  eleccion: string;
  /** Consejo ya resuelto contra el catálogo: «01 TUXTLA GUTIÉRREZ». */
  consejo: string;
  /** Tipo del catálogo: «DOCUMENTO Documentación electoral». */
  tipo: string;
  descripcion: string;
  version: string;
  cantidad: string;
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
  total: number;
  insertados: number;
  actualizados: number;
  /** Renglones conservados porque el consejo ya capturó su cantidad física. */
  omitidos_comprobados: number;
  /** Renglones que ya existían más de una vez y no se pueden actualizar sin ambigüedad. */
  omitidos_duplicados: number;
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
  id_documento: string;
  id_eleccion: string;
  desc_eleccion: string;
  tipo_doc: string;
  desc_tipo: string | null;
  desc_documento: string;
  version: string | null;
  /** Cantidad entregada por la oficina central. */
  cantidad: number | null;
  /** Cantidad contada por el consejo; null mientras no captura. */
  cantidad_fisica: number | null;
  diferencia: number | null;
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
}

/** Una captura del historial, con su autor. */
export interface IComprobacionCaptura {
  id: number;
  cantidad_fisica: number;
  diferencia: number;
  observaciones: string;
  fecha_registro: string;
  id_usuario: number | null;
  usuario: string | null;
}

/** Historial de capturas de un renglón: cada corrección deja rastro. */
export interface IComprobacionHistorial {
  id: number;
  id_documento: string;
  id_eleccion: string;
  tipo_doc: string;
  desc_documento: string;
  version: string | null;
  cantidad: number | null;
  cantidad_fisica: number | null;
  diferencia: number | null;
  capturas: IComprobacionCaptura[];
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
