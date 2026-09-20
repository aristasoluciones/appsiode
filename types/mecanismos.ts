/**
 * Mecanismos de recolección. Contrato de `/mecanismos` — el API responde en
 * snake_case tal como sale de las funciones de PostgreSQL.
 */

export type TTipoConsejoChar = 'D' | 'M';

/** Tipos de mecanismo del catálogo (`cat.mecanismos_tipos`). */
export type TTipoMecanismo = 'DAT' | 'CRYT_FIJO' | 'CRYT_ITINERANTE';

/** Estatus de la cédula del mecanismo, compartida por sus consejos. */
export type TCedulaEstatus =
  | 'SIN_CEDULA'
  | 'PROPUESTA'
  | 'INFORMADA'
  | 'APROBADA'
  | 'CERRADA'
  | 'ANULADA';

/** Estatus de la revisión de la cédula por cada consejo. */
export type TRevisionEstatus = 'PENDIENTE' | 'INFORMADA' | 'ACUSADA';

/** Estatus del estudio de factibilidad de un distrito federal. */
export type TEstudioEstatus = 'PROPUESTO' | 'APROBADO' | 'CERRADO' | 'ANULADO';

/** Filtro de diferencia (costo cotizado menos costo INE) de la bandeja de cédulas. */
export type TDiferenciaFiltro = 'igual' | 'mayor' | 'menor';

/** Tipos de carga que guarda el historial de importaciones. */
export type TImportacionTipo =
  | 'MECANISMOS'
  | 'CEDULAS'
  | 'CAES'
  | 'CAES_ASIGNACION';

// ---------------------------------------------------------------- Catálogos

export interface IMecanismoTipo {
  clave: TTipoMecanismo;
  descripcion: string;
  orden: number;
  activo: boolean;
}

/** Renglón del marco geográfico: un municipio dentro de su distrito local y federal. */
export interface IMarcoGeografico {
  id_df: number;
  df: string;
  id_dl: number;
  dl: string;
  id_mun: number;
  municipio: string;
}

/** Verificación de catálogos antes de importar o dar de alta; `listo` resume los faltantes. */
export interface ICatalogosVerificacion {
  distritos_federales: number;
  distritos_locales: number;
  municipios: number;
  consejos_distritales: number;
  consejos_municipales: number;
  casillas: number;
  tipos_mecanismo: number;
  listo: boolean;
  faltantes: string[];
  avisos: string[];
}

// ---------------------------------------------------------------- Mecanismos

/** Casilla que atiende el mecanismo, con su municipio y distrito local. */
export interface IMecanismoCasilla {
  id: number;
  seccion: number;
  casilla_tipo: string;
  id_mun: number;
  municipio: string | null;
  id_dl: number;
  orden: number;
  /** Existe en `cat.casillas`; en falso se informa, no bloquea. */
  en_catalogo: boolean;
}

/** Consejo vinculado al mecanismo con su informe y su revisión de la cédula. */
export interface IMecanismoConsejo {
  id: number;
  tipo_consejo: TTipoConsejoChar;
  id_consejo: number;
  consejo: string | null;
  /** Es el consejo que informa el mecanismo (CAE, costo estimado). */
  revisa_mecanismo: boolean;
  cae_folio: string | null;
  cae_nombre: string | null;
  costo_estimado: number | null;
  observaciones_informe: string | null;
  fecha_informe: string | null;
  informe_estatus_desc: 'Sin informar' | 'Informado';
  estatus: TRevisionEstatus;
  estatus_desc: string;
  costo_cotizado: number | null;
  diferencia: number | null;
  observaciones_cedula: string | null;
  fecha_cedula: string | null;
  observaciones_acuse: string | null;
  fecha_acuse: string | null;
}

/** Datos de la cédula que viven en el mecanismo (un PDF compartido por sus consejos). */
export interface IMecanismoCedulaBase {
  cedula_estatus: TCedulaEstatus;
  cedula_estatus_desc: string;
  costo_ine: number | null;
  costo_autorizado: number | null;
}

/** Renglón de la lista de mecanismos: consejo (los que informa) u oficina central (todos). */
export interface IMecanismoLista extends IMecanismoCedulaBase {
  id: number;
  id_df: number;
  df: string | null;
  tipo: TTipoMecanismo;
  tipo_desc: string;
  numero: number;
  /** Dato del INE: qué consejo revisa el mecanismo. */
  visualizacion: string | null;
  eleccion_atendida: string | null;
  distancia_km: number | null;
  tiempo_recorrido_minutos: number | null;
  /** HH:MM ya formateado por el API. */
  tiempo_recorrido: string | null;
  cotizacion_tipo_consejo: TTipoConsejoChar | null;
  cotizacion_id_consejo: number | null;
  cotizacion_consejo: string | null;
  activo: boolean;
  tiene_observaciones: boolean;
  secciones: string | null;
  casillas_texto: string | null;
  total_casillas: number;
  /** Casillas del consejo que consulta dentro de la ruta compartida; 0 para oficina central. */
  casillas_propias: number;
  municipios: string | null;
  consejos_texto: string | null;
  total_consejos: number;
  /** «D-12» / «M-45»: el consejo que informa. */
  revisor: string | null;
  revisor_consejo: string | null;
  informe_estatus_desc: 'Sin informar' | 'Informado';
  informado: boolean;
  /** Informe del consejo que consulta o, para oficina central, del que informa. */
  id_revision: number | null;
  cae_folio: string | null;
  cae_nombre: string | null;
  /** Nulo sin CAE; falso cuando el CAE congelado ya no está activo en el catálogo. */
  cae_activo: boolean | null;
  costo_estimado: number | null;
  observaciones_informe: string | null;
  fecha_informe: string | null;
  /** Banderas efectivas del consejo que consulta; nulas para oficina central. */
  captura_costo: boolean | null;
  asigna_cae: boolean | null;
  id_importacion: number | null;
  created_at: string;
  updated_at: string | null;
}

/** Detalle del mecanismo con consejos y casillas; también lo devuelve cada escritura. */
export interface IMecanismo extends IMecanismoCedulaBase {
  id: number;
  id_proceso: number;
  id_df: number;
  df: string | null;
  tipo: TTipoMecanismo;
  tipo_desc: string;
  numero: number;
  visualizacion: string | null;
  eleccion_atendida: string | null;
  distancia_km: number | null;
  tiempo_recorrido_minutos: number | null;
  tiempo_recorrido: string | null;
  cotizacion_tipo_consejo: TTipoConsejoChar | null;
  cotizacion_id_consejo: number | null;
  cotizacion_consejo: string | null;
  observaciones_admin: string | null;
  observaciones_admin_fecha: string | null;
  id_importacion: number | null;
  activo: boolean;
  archivo_propuesta: string | null;
  fecha_propuesta: string | null;
  archivo_aprobada: string | null;
  fecha_aprobacion: string | null;
  fecha_cierre: string | null;
  motivo_anulacion: string | null;
  fecha_anulacion: string | null;
  created_at: string;
  updated_at: string | null;
  secciones: string | null;
  casillas_texto: string | null;
  total_casillas: number;
  casillas: IMecanismoCasilla[];
  consejos: IMecanismoConsejo[];
}

/** Renglón del seguimiento de oficina central: un consejo del tipo, aunque vaya en ceros. */
export interface IMecanismoSeguimiento {
  id_consejo: number;
  tipo_consejo: TTipoConsejoChar;
  consejo: string;
  captura_costo: boolean;
  asigna_cae: boolean;
  mecanismos: number;
  dat: number;
  cryt_fijo: number;
  cryt_itinerante: number;
  informados: number;
  sin_informar: number;
  porcentaje_informados: number;
  con_cae: number;
  costo_estimado: number;
  cedulas: number;
  cedulas_sin_cedula: number;
  cedulas_propuestas: number;
  cedulas_informadas: number;
  cedulas_aprobadas: number;
  cedulas_cerradas: number;
  cedulas_anuladas: number;
  revisiones_informadas: number;
  ultimo_informe: string | null;
  caes_activos: number;
}

/** Consejo vinculado en el alta o la edición (los combos Municipio/s y ODE/s). */
export interface IMecanismoConsejoPayload {
  tipo_consejo: TTipoConsejoChar;
  id_consejo: number;
}

export interface IMecanismoCasillaPayload {
  seccion: number;
  casilla_tipo: string;
  id_mun: number;
  id_dl: number;
}

/** Alta y edición por oficina central; en la edición las casillas van por su propio endpoint. */
export interface IMecanismoPayload {
  id_df: number;
  tipo: TTipoMecanismo;
  numero: number;
  consejos: IMecanismoConsejoPayload[];
  /** Consejo que informa; si no viene, el primer municipal. */
  revisor_tipo_consejo?: TTipoConsejoChar | null;
  revisor_id_consejo?: number | null;
  cotizacion_tipo_consejo?: TTipoConsejoChar | null;
  cotizacion_id_consejo?: number | null;
  distancia_km?: number | null;
  tiempo_recorrido_minutos?: number | null;
  costo_ine?: number | null;
  eleccion_atendida?: string | null;
  casillas?: IMecanismoCasillaPayload[];
}

export interface IMecanismoCasillasPayload {
  casillas: IMecanismoCasillaPayload[];
}

export interface IMecanismoEstatusPayload {
  activo: boolean;
}

/** Observaciones de oficina central; vacías para retirarlas. */
export interface IMecanismoObservacionesPayload {
  observaciones: string | null;
}

/** Informe del consejo que revisa: el folio del CAE es obligatorio solo si el consejo asigna CAE. */
export interface IMecanismoInformarPayload {
  cae_folio?: string | null;
  costo?: number | null;
  observaciones: string;
}

export interface IMotivoPayload {
  motivo: string;
}

// ---------------------------------------------------------------- Importación del archivo del INE

/** Renglón del archivo del INE tal como se previsualiza: una casilla y su mecanismo. */
export interface IMecanismoImportacionFila {
  fila: number;
  id_df: number | null;
  id_dl: number | null;
  id_mun: number | null;
  municipio: string;
  seccion: number | null;
  casilla_tipo: string;
  tipo: string;
  tipo_capturado: string;
  numero: number | null;
  visualizacion: string | null;
  eleccion_atendida: string | null;
  costo_ine: number | null;
  errores: string[];
}

/** Efecto de un mecanismo del archivo sobre lo ya cargado. */
export type TImportacionEfecto =
  | 'NUEVO'
  | 'ACTUALIZA'
  | 'SIN_CAMBIOS'
  | 'RECHAZADO';

export interface IMecanismoImportacionCasilla {
  seccion: number;
  casilla_tipo: string;
  id_mun: number;
  id_dl: number;
  orden: number;
}

/** Mecanismo agrupado a partir de sus renglones, con su efecto sobre la base. */
export interface IMecanismoImportacionAgrupado {
  id_df: number;
  tipo: string;
  numero: number;
  visualizacion: string | null;
  eleccion_atendida: string | null;
  costo_ine: number | null;
  /** Id del mecanismo que ya existe; nulo si es nuevo. */
  id: number | null;
  /** «D-12» / «M-45»: consejo que informará el mecanismo. */
  revisor: string | null;
  casillas_fuera_del_catalogo: number;
  efecto: TImportacionEfecto;
  casillas: IMecanismoImportacionCasilla[];
}

/** Vista previa de la importación del archivo del INE, sin guardar nada. */
export interface IMecanismosImportacionValidacion {
  total: number;
  validas: number;
  rechazadas: number;
  mecanismos: number;
  mecanismos_nuevos: number;
  mecanismos_actualizados: number;
  sin_cambios: number;
  casillas_fuera_del_catalogo: number;
  casillas_del_catalogo_sin_mecanismo: number;
  catalogo_casillas_vacio: boolean;
  columnas_opcionales: string[];
  filas_rechazadas: IMecanismoImportacionFila[];
  /** Filas rechazadas que no cupieron en la respuesta. */
  rechazadas_omitidas: number;
  muestra: IMecanismoImportacionAgrupado[];
}

/** Resultado de la importación aplicada. */
export interface IMecanismosImportacionResultado {
  id: number;
  total: number;
  nuevos: number;
  actualizados: number;
  sin_cambios: number;
}

/** Renglón del historial de importaciones del proceso. */
export interface IImportacion {
  id: number;
  tipo: TImportacionTipo;
  archivo: string | null;
  total: number;
  nuevos: number;
  actualizados: number;
  sin_cambios: number;
  rechazados: number;
  revertida: boolean;
  motivo_reversion: string | null;
  fecha_reversion: string | null;
  fecha: string;
  id_usuario: number | null;
  usuario: string;
  id_usuario_reversion: number | null;
  usuario_reversion: string;
  /** Es la carga más reciente y no revertida de su tipo. */
  reversible: boolean;
}

/** Renglón del detalle de una importación de mecanismos. */
export interface IImportacionDetalleItem {
  accion: 'NUEVO' | 'ACTUALIZADO' | 'SIN_CAMBIOS';
  id_mecanismo: number;
  id_df: number | null;
  tipo: string | null;
  numero: number | null;
  /** El mecanismo sigue existiendo (falso si se eliminó al revertir). */
  existe: boolean;
  casillas_anteriores: number | null;
  casillas_actuales: number;
  /** Estado previo del mecanismo cuando la carga lo actualizó. */
  anterior: Record<string, unknown> | null;
}

/** Detalle paginado de una importación de mecanismos. */
export interface IImportacionDetalle {
  importacion: Omit<
    IImportacion,
    | 'id_usuario'
    | 'usuario'
    | 'id_usuario_reversion'
    | 'usuario_reversion'
    | 'reversible'
  >;
  pagina: number;
  por_pagina: number;
  total: number;
  items: IImportacionDetalleItem[];
}

export interface IImportacionReversion {
  id: number;
  eliminados: number;
  restaurados: number;
}

// ---------------------------------------------------------------- CAE

export type TCaeCategoria = 'SEL' | 'CAEL' | 'RESERVA';

/** Renglón del catálogo de CAE, sea de la tabla o del sistema que los administra. */
export interface ICae {
  id: number | null;
  tipo_consejo: TTipoConsejoChar;
  id_consejo: number;
  consejo: string | null;
  folio: string;
  categoria: TCaeCategoria | string;
  paterno: string | null;
  materno: string | null;
  nombre: string;
  nombre_completo: string;
  activo: boolean;
  mecanismos_asignados: number;
}

/** Catálogo de CAE con su fuente: la tabla semilla o la API externa del proceso. */
export interface ICaesCatalogo {
  fuente: 'TABLA' | 'API';
  api_base: string | null;
  caes: ICae[];
}

/** Renglón del listado de CAE revisado o aplicado. */
export interface ICaeImportacionItem {
  folio: string;
  nombre_completo: string;
  categoria: string;
  /** «D-12» / «M-45». */
  consejo: string;
  activo: boolean;
  efecto: 'NUEVO' | 'ACTUALIZA' | 'SIN_CAMBIOS' | 'RECHAZADO';
  error: string | null;
}

/** Vista previa o resultado de la importación del listado de CAE. */
export interface ICaesImportacionResultado {
  /** Id en el historial; nulo en la vista previa. */
  id: number | null;
  total: number;
  nuevos: number;
  actualizados: number;
  sin_cambios: number;
  rechazados: number;
  items: ICaeImportacionItem[];
}

/** Renglón del Excel de asignación masiva revisado o aplicado. */
export interface ICaeAsignacionItem {
  id_mecanismo: number;
  id_df: number | null;
  tipo: string | null;
  numero: number | null;
  /** «D-12» / «M-45»: consejo que informa el mecanismo. */
  consejo: string | null;
  cae_actual: string | null;
  cae_nombre_actual: string | null;
  folio: string | null;
  cae_nombre: string | null;
  efecto: 'ASIGNA' | 'RETIRA' | 'SIN_CAMBIOS' | 'RECHAZADO';
  error: string | null;
}

/** Vista previa o resultado de la asignación masiva de CAE. */
export interface ICaesAsignacionResultado {
  id: number | null;
  total: number;
  asignados: number;
  retirados: number;
  sin_cambios: number;
  rechazados: number;
  items: ICaeAsignacionItem[];
}

// ---------------------------------------------------------------- Configuración por consejo

/** Banderas efectivas de un consejo; `por_omision` cuando nadie las ha fijado. */
export interface IMecanismoConfiguracion {
  id_consejo: number;
  tipo_consejo: TTipoConsejoChar;
  consejo: string;
  captura_costo: boolean;
  asigna_cae: boolean;
  por_omision: boolean;
}

/** Nulas vuelven al valor por omisión del tipo (municipal sí, distrital no). */
export interface IMecanismoConfiguracionPayload {
  captura_costo: boolean | null;
  asigna_cae: boolean | null;
}

// ---------------------------------------------------------------- Cédulas

/** Cédula vista por el consejo: una por mecanismo vinculado, con la acción que admite. */
export interface ICedulaConsejo extends IMecanismoCedulaBase {
  /** Id del mecanismo; la cédula se identifica por él. */
  id: number;
  id_revision: number;
  id_df: number;
  df: string | null;
  tipo: TTipoMecanismo;
  tipo_desc: string;
  numero: number;
  revisa_mecanismo: boolean;
  casillas_texto: string | null;
  total_casillas: number;
  casillas_propias: number;
  tiene_propuesta: boolean;
  fecha_propuesta: string | null;
  tiene_aprobada: boolean;
  fecha_aprobacion: string | null;
  fecha_cierre: string | null;
  observaciones_cierre: string | null;
  motivo_anulacion: string | null;
  fecha_anulacion: string | null;
  estatus: TRevisionEstatus;
  estatus_desc: string;
  costo_cotizado: number | null;
  diferencia: number | null;
  observaciones_cedula: string | null;
  fecha_cedula: string | null;
  observaciones_acuse: string | null;
  fecha_acuse: string | null;
  captura_costo: boolean;
  puede_informar: boolean;
  puede_acusar: boolean;
}

/** Resumen de oficina central: un consejo del tipo con sus cédulas por estatus. */
export interface ICedulasResumenConsejo {
  id_consejo: number;
  tipo_consejo: TTipoConsejoChar;
  consejo: string;
  captura_costo: boolean;
  cedulas: number;
  sin_cedula: number;
  propuestas: number;
  informadas: number;
  aprobadas: number;
  cerradas: number;
  anuladas: number;
  revisiones_informadas: number;
  revisiones_acusadas: number;
  pendientes_de_informar: number;
  pendientes_de_acusar: number;
  costo_ine: number;
  costo_cotizado: number;
  diferencia: number;
  costo_autorizado: number;
  ultimo_informe: string | null;
}

/** Renglón de la bandeja general: la revisión de un consejo sobre la cédula de un mecanismo. */
export interface ICedulaBandeja extends IMecanismoCedulaBase {
  id: number;
  id_revision: number;
  tipo_consejo: TTipoConsejoChar;
  id_consejo: number;
  consejo: string | null;
  id_df: number;
  df: string | null;
  tipo: TTipoMecanismo;
  tipo_desc: string;
  numero: number;
  revisa_mecanismo: boolean;
  tiene_propuesta: boolean;
  fecha_propuesta: string | null;
  tiene_aprobada: boolean;
  fecha_aprobacion: string | null;
  fecha_cierre: string | null;
  fecha_anulacion: string | null;
  estatus: TRevisionEstatus;
  estatus_desc: string;
  costo_cotizado: number | null;
  diferencia: number | null;
  observaciones_cedula: string | null;
  fecha_cedula: string | null;
  observaciones_acuse: string | null;
  fecha_acuse: string | null;
}

/** Revisión de un consejo dentro del detalle de la cédula. */
export interface ICedulaRevision {
  id: number;
  tipo_consejo: TTipoConsejoChar;
  id_consejo: number;
  consejo: string | null;
  revisa_mecanismo: boolean;
  captura_costo: boolean;
  estatus: TRevisionEstatus;
  estatus_desc: string;
  costo_cotizado: number | null;
  diferencia: number | null;
  observaciones_cedula: string | null;
  fecha_cedula: string | null;
  observaciones_acuse: string | null;
  fecha_acuse: string | null;
}

/** Renglón del historial de una cédula, un estudio o un informe. */
export interface IMecanismoHistorial {
  id: number;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  texto: string | null;
  fecha: string;
  id_usuario: number | null;
  usuario: string;
}

/** Detalle de la cédula: el mecanismo, las revisiones (todas o la propia) y el historial. */
export interface ICedula {
  mecanismo: IMecanismo;
  revisiones: ICedulaRevision[];
  historial: IMecanismoHistorial[];
}

/** Respuesta de proponer o reemplazar: el mecanismo y, si hubo, el PDF que se retiró. */
export interface ICedulaPropuesta {
  mecanismo: IMecanismo;
  archivo_anterior: string | null;
}

export interface ICedulaProponerPayload {
  id_mecanismo: number;
  costo_ine: number;
  archivo: File;
}

/** Reemplazo de la propuesta: el PDF, el costo INE o ambos. */
export interface ICedulaReemplazarPayload {
  costo_ine?: number | null;
  archivo?: File | null;
}

export interface ICedulaAprobarPayload {
  costo_autorizado: number;
  archivo: File;
}

/** El consejo informa su costo cotizado (si captura costo) y observaciones. */
export interface ICedulaInformarPayload {
  costo_cotizado?: number | null;
  observaciones: string;
}

/** Observaciones del acuse del consejo o del cierre de oficina central. */
export interface ICedulaObservacionesPayload {
  observaciones?: string | null;
}

/** Un PDF del zip, desarmado y emparejado con su mecanismo. */
export interface ICedulaDocumento {
  archivo: string;
  id_dl: number | null;
  id_mun: number | null;
  id_df: number | null;
  tipo: string | null;
  numero: number | null;
  id_mecanismo: number | null;
  cedula_estatus: TCedulaEstatus | null;
  /** NUEVO (se creará el mecanismo), PROPONE, REEMPLAZA o RECHAZADO. */
  efecto: 'NUEVO' | 'PROPONE' | 'REEMPLAZA' | 'RECHAZADO';
  error: string | null;
}

/** Vista previa del zip de cédulas. */
export interface ICedulasDocumentosValidacion {
  total_archivos: number;
  validos: number;
  proponen: number;
  reemplazan: number;
  mecanismos_nuevos: number;
  rechazados: number;
  omitidos: number;
  mecanismos_sin_cedula: number;
  documentos: ICedulaDocumento[];
}

/** Resultado de la carga del zip aplicada. */
export interface ICedulasDocumentosResultado {
  id: number;
  aplicados: number;
  creados: number;
  rechazados: number;
  archivos_anteriores: string[];
  items: ICedulaDocumento[];
}

// ---------------------------------------------------------------- Estudios de factibilidad

/** Estudio de un distrito federal visto por el consejo, aunque aún no exista. */
export interface IEstudioConsejo {
  id_df: number;
  df: string;
  /** Nulo mientras oficina central no lo proponga. */
  id: number | null;
  estatus: TEstudioEstatus | null;
  estatus_desc: string | null;
  tiene_propuesta: boolean;
  fecha_propuesta: string | null;
  tiene_aprobada: boolean;
  fecha_aprobacion: string | null;
  fecha_cierre: string | null;
  motivo_anulacion: string | null;
  fecha_anulacion: string | null;
  id_acuse: number | null;
  observaciones_etapa1: string | null;
  fecha_etapa1: string | null;
  observaciones_etapa2: string | null;
  fecha_etapa2: string | null;
  puede_acusar_propuesta: boolean;
  puede_acusar_aprobacion: boolean;
  consejos: number;
  acuses_etapa1: number;
  acuses_etapa2: number;
}

/** Acuse de un consejo dentro del detalle del estudio. */
export interface IEstudioAcuse {
  id: number;
  tipo_consejo: TTipoConsejoChar;
  id_consejo: number;
  consejo: string | null;
  observaciones_etapa1: string | null;
  fecha_etapa1: string | null;
  observaciones_etapa2: string | null;
  fecha_etapa2: string | null;
}

/** Detalle del estudio con acuses (todos o el propio) e historial. */
export interface IEstudio {
  id: number;
  id_df: number;
  df: string;
  estatus: TEstudioEstatus;
  estatus_desc: string;
  tiene_propuesta: boolean;
  fecha_propuesta: string | null;
  tiene_aprobada: boolean;
  fecha_aprobacion: string | null;
  fecha_cierre: string | null;
  motivo_anulacion: string | null;
  fecha_anulacion: string | null;
  consejos: number;
  acuses_etapa1: number;
  acuses_etapa2: number;
  acuses: IEstudioAcuse[];
  historial: IMecanismoHistorial[];
}

/** Renglón del tablero de avance: un distrito federal, aunque no tenga estudio. */
export interface IEstudioAvanceDistrito {
  id_df: number;
  df: string;
  id: number | null;
  estatus: TEstudioEstatus | null;
  estatus_desc: string | null;
  /** Tiene estudio vigente (no anulado). */
  cargado: boolean;
  /** Está aprobado o cerrado. */
  validado: boolean;
  consejos: number;
  consejos_d: number;
  consejos_m: number;
  acuses_etapa1: number;
  acuses_etapa2: number;
  porcentaje_acuses: number;
  completo: boolean;
  fecha_propuesta: string | null;
  fecha_aprobacion: string | null;
  fecha_cierre: string | null;
  fecha_anulacion: string | null;
}

export interface IEstudiosAvanceResumen {
  distritos: number;
  cargados: number;
  porcentaje_cargados: number;
  validados: number;
  porcentaje_validados: number;
  sin_estudio: number;
  propuestos: number;
  aprobados: number;
  cerrados: number;
  anulados: number;
  consejos_esperados: number;
  acuses_etapa1: number;
  porcentaje_acuses_etapa1: number;
  acuses_etapa2: number;
  porcentaje_acuses_etapa2: number;
  ultima_carga: string | null;
}

/** Tablero de oficina central: totales del estado y los distritos federales. */
export interface IEstudiosAvance {
  resumen: IEstudiosAvanceResumen;
  distritos: IEstudioAvanceDistrito[];
}

/** Respuesta de proponer o reemplazar: el estudio y, si hubo, el PDF que se retiró. */
export interface IEstudioPropuesta {
  estudio: IEstudio;
  archivo_anterior: string | null;
}

export interface IEstudioProponerPayload {
  id_df: number;
  archivo: File;
}

/** Acuse del consejo: etapa 1 (propuesto) o 2 (aprobado) con observaciones. */
export interface IEstudioAcusarPayload {
  etapa: 1 | 2;
  observaciones: string;
}
