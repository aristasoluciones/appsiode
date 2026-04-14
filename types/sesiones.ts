// ─── Tipos centralizados del módulo Sesiones ──────────────────────────────────

export type TEstadoIndicador = 'programada' | 'con_demora' | 'en_proceso' | 'concluida';

// ─── Catálogos (`GET /Catalogos`) ─────────────────────────────────────────────

export interface ICatalogoConsejo {
  tipo_consejo: 'D' | 'M';
  clave_consejo: number;
  id_consejo: number;
  consejo: string;
}

export interface ICatalogoPartido {
  id: number;
  partido_coalicion: string;
  siglas: string;
  imagen: string;
  tipo: string;
  orden: number;
  color: string;
}

export interface ICatalogoCasilla {
  id: number;
  seccion: number;
  casilla: string;
  tipo_casilla_desc: string;
  municipio: string;
  domicilio: string;
  status: string;
}

export interface ICatalogosData {
  anio_actual: number;
  num_sesiones: { num: number; orden: number }[] | null;
  secciones: { seccion: number }[];
  consejos: ICatalogoConsejo[];
  partidos: ICatalogoPartido[];
  procedencias: { id: number; procedencia: string }[];
  tipos_documentos: { id: number; tipo: string }[];
  tipos_sesiones: { tipo: string }[];
  casillas: ICatalogoCasilla[];
}

// ─── Crear sesión (`POST /Sesiones`) ─────────────────────────────────────────

export interface IPuntoOrdenDia {
  id_punto: number;
  tipo: string;
  descripcion: string;
  id_subpunto: number;
}

// ─── Asistencia de consejeros ────────────────────────────────────────────────

/** Payload mínimo para iniciar sesión (POST /Sesiones/{id}/iniciar) */
export interface IConsejeroAsistenciaInput {
  cargo: string;
  genero: string;
  nombre: string;
  apellidos: string;
  id_cargo: number;
}

/**
 * Registro completo tras iniciar. Se usa Partial para los campos
 * que solo existen después de persistir en BD, evitando dos interfaces.
 */
export type IConsejeroAsistencia = IConsejeroAsistenciaInput & Partial<{
  id_asistencia: number;
  id_sesion: number;
  asistencia: boolean;
  fecha_reg: string;
  validado: boolean;
  validado_nombre: string | null;
  orden: number;
}>;

export interface ICrearSesionInput {
  tipo: string;
  no_sesion: string;
  anio: number;
  fecha_hora: string;   // ISO datetime
  url?: string;
  consejos: { tipo_consejo: string; id_consejo: number }[];
  pod?: IPuntoOrdenDia[];
}

/** Forma cruda que devuelve el .NET API (`GET /Sesiones/indicadores`) */
export interface IIndicadorAPI {
  id_consejo: number;
  clave_consejo: string;
  consejo: string;
  tipo_consejo: 'D' | 'M';
  sesiones_programadas: number;
  sesiones_con_demora: number;
  sesiones_en_proceso: number;
  sesiones_concluidas: number;
  sesiones_total: number;
}

/** Forma normalizada para la UI (DataGrid de indicadores) */
export interface IConsejoIndicador {
  clave: string;
  nombre: string;
  programadas: number;
  conDemora: number;
  enProceso: number;
  concluidas: number;
  total: number;
}

/**
 * Opción para el selector de sesiones.
 *
 * `id` usa el formato que espera el .NET API en el query param `sesion`:
 * - Todas las sesiones → `"TODAS;TODAS"`
 * - Sesión específica  → `"no_sesion;tipo;fecha_hora"`
 */
export interface ISesionOption {
  id: string;
  label: string;
}

/** Forma que devuelve el endpoint `GET /Sesiones/distinct` */
export interface ISesionDistinct {
  no_sesion: string;
  tipo: string;
  fecha_hora: string;
}

/** Forma cruda que devuelve `GET /Sesiones/consejo/{tipo}/{id}` */
export interface ISesionConsejoAPI {
  row_num: number;
  id: number;
  no_sesion: string;
  tipo: string;
  fecha_programada: string;
  fecha_inicio: string | null;
  fecha_termino: string | null;
  status: string;
  status_color: string;
  status_text: string;
  incidencias: number;
}

/** Forma normalizada para la UI (lista de sesiones de un consejo) */
export interface ISesionConsejo {
  id: number;
  noSesion: string;
  tipo: string;
  fechaProgramada: string;
  fechaInicio: string | null;
  fechaTermino: string | null;
  status: string;
  statusColor: string;
  statusText: string;
  incidencias: number;
}

/** Info del consejo incluida en el `meta` de la respuesta */
export interface IConsejoMeta {
  id_consejo: number;
  clave_consejo: string;
  consejo: string;
  tipo_consejo: 'D' | 'M';
  tipo_consejo_desc: string; // "Distrital" o "Municipal"
}

/**
 * Payload después del interceptor de axios para
 * `GET /Sesiones/consejo/{tipo}/{id}`.
 * El interceptor ya des-envuelve `{ isSuccess, data }`, de modo que
 * `response.data` es directamente este objeto.
 */
export interface ISesionesConsejoPayload {
  data: ISesionConsejoAPI[];
  meta: {
    consejo: IConsejoMeta;
  };
}

/** Documento/expediente de una sesión */
export interface IExpediente {
  no_doc: string;
  tipo: string;
  fecha: string | null;
  descripcion: string;
  url: string | null;
}

/** Forma cruda de `GET /Sesiones/{idSesion}` */
export interface ISesionDetalleAPI {
  sesion: {
    id: number;
    id_proceso: number;
    id_consejo: number;
    tipo_consejo: 'D' | 'M';
    no_sesion: string;
    tipo: string;
    fecha_hora: string;
    url: string | null;
    fecha_registro: string;
    fecha_inicio: string | null;
    fecha_conclusion: string | null;
    asistencia: boolean;
    status: string;
    status_text: string;
  };
  pod: {
    id_sesion: number;
    id_punto: number;
    tipo: string;
    descripcion: string;
    id_subpunto: number;
    fecha_reg: string;
    votos_afavor: number;
    votos_encontra: number;
    votos_abstencion: number;
  }[];
  votacion: unknown;
  asistencia: IConsejeroAsistencia[];
  asistencia_pp: {
    id_asistencia_pp: number;
    id_sesion: number;
    id_partido: number;
    nombre: string;
    apellidos: string;
    cargo: string;
    genero: string;
    asistencia: boolean;
    fecha_reg: string;
    nombramiento_no: string | null;
    nombramiento_fecha: string | null;
    nombramiento_url: string | null;
    nombramiento_status: string | null;
    id_representante: number;
    domicilio: string | null;
    telefono: string | null;
    celular: string | null;
    correo: string | null;
  }[];
  incidencias: unknown;
  expedientes: IExpediente[] | null;
}

export interface ISesionDetalleResponseEnvelope {
  status: number;
  message: string;
  data: ISesionDetalleAPI;
}

/** Forma normalizada para UI de detalle de sesión */
export interface ISesionDetalle {
  id: number;
  noSesion: string;
  tipo: string;
  status: string;
  statusText: string;
  fechaProgramada: string;
  fechaInicio: string | null;
  fechaConclusion: string | null;
  url: string | null;
  pod: ISesionDetalleAPI['pod'];
  asistencia: ISesionDetalleAPI['asistencia'];
  asistenciaPP: ISesionDetalleAPI['asistencia_pp'];
  incidencias: unknown;
  expedientes: IExpediente[] | null;
}

export interface IConsejeroExterno {
  consejo_tipo: string;
  consejo_clave: number;
  consejo: string;
  id: number;
  grupo_cargo: string;
  id_cargo: number;
  nombre: string;
  apellidos: string;
  genero: string;
  cargo: string;
}

export interface IRepresentanteNorm {
  id_representante: number;
  id_partido: number;
  partyName: string;
  partyImagePath: string | null;
  nombre: string;
  apellidos: string;
  cargo: string;
  genero: string;
  asistencia: boolean;
  nombramiento_no: string | null;
  nombramiento_fecha: string | null;
  nombramiento_url: string | null;
  nombramiento_status: string | null;
  telefono: string | null;
  celular: string | null;
  correo: string | null;
  domicilio: string | null;
}