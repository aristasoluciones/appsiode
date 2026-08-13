// ─── Tipos centralizados del módulo Aperturas de Bodegas ─────────────────────

export type TTipoEleccion = 'AYUN' | 'DIPU' | 'GOB';
export type TSacarPaquetesFront = 'NINGUNO' | 'INGRESO' | 'SALIDA';

export const TIPOS_ELECCION: TTipoEleccion[] = ['AYUN', 'DIPU', 'GOB'];

/** Nombre de la bodega según la elección, para mostrar en pantalla. */
export const ELECCION_LABEL: Record<TTipoEleccion, string> = {
  AYUN: 'Ayuntamientos',
  DIPU: 'Diputaciones',
  GOB: 'Gubernatura',
};

export const SACAR_PAQUETES_OPTIONS: { value: TSacarPaquetesFront; label: string }[] = [
  { value: 'NINGUNO', label: 'Ninguno' },
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'SALIDA', label: 'Salida' },
];

// ─── Catálogos ────────────────────────────────────────────────────────────────

export interface ICatalogoEleccion {
  id: number;
  clave: TTipoEleccion;
  descripcion: string;
}

export interface ICatalogoCasilla {
  id: number;
  seccion: number;
  casilla: string;
  casilla_desc: string;
  municipio: string;
  domicilio: string;
  status: string;
}

export interface ICatalogoCargoApertura {
  id: number;
  cargo: string;
}

export interface ICatalogoProcedencia {
  id: number;
  procedencia: string;
}

export interface IAperturasCatalogosData {
  elecciones: ICatalogoEleccion[];
  consejos: { tipo_consejo: 'D' | 'M'; clave_consejo: number; id_consejo: number; consejo: string }[];
  casillas: ICatalogoCasilla[];
  secciones: { seccion: number }[];
  cargosApertura: ICatalogoCargoApertura[];
  procedencias: ICatalogoProcedencia[];
}

// ─── Entidades del backend ────────────────────────────────────────────────────

export interface IAperturaBodega {
  id: number;
  id_consejo: number;
  tipo_consejo: 'D' | 'M';
  clave_consejo: number;
  consejo: string;
  bodega: TTipoEleccion;
  fecha_apertura: string;       // yyyy-MM-dd
  hora_apertura: string;        // HH:mm:ss
  fecha_cierre: string | null;
  hora_cierre: string | null;
  motivo: string;
  observaciones: string | null;
  sellos_apertura: boolean;
  sellos_cierre: boolean | null;
  sacar_paquetes: string;       // INGRESO | SALIDA | NINGUNO | REINGRESO (interno)
  abierta: boolean;
  status_text?: string | null;
  status_color?: string | null;
  // Totales numéricos que vienen sueltos en el response del endpoint de lista.
  // En el endpoint de detalle los mismos conceptos son arrays (`consejeros_lista`,
  // `representantes_lista`, `otros_lista`, `paquetes_lista`) — aquí solo llega
  // el conteo agregado para mostrarlo en la tabla.
  consejeros?: number;
  representantes?: number;
  otros?: number;
  paquetes?: number;
  motivo_truncado?: string;
}

/**
 * Datos del consejo que acompañan al listado de aperturas de un consejo
 * específico (`meta.consejo`), con el mismo patrón que sesiones: el front los
 * usa para el breadcrumb sin consultas extra.
 */
export interface IAperturaConsejoMeta {
  id: number;
  consejo: string;
  tipo_consejo: 'D' | 'M';
  tipo_consejo_desc: string; // "Distritales" o "Municipales"
  clave_consejo: string;
}

export interface IAperturasListaMeta {
  consejo: IAperturaConsejoMeta;
}

export interface IAperturaBodegaListaPayload {
  data: IAperturaBodega[];
  meta?: IAperturasListaMeta;
}

export interface IAperturaBodegaDetallePayload {
  data: IAperturaBodegaDetalleAPI;
  meta?: IAperturasListaMeta;
}

/**
 * Resumen por consejo para la vista de administrador.
 * `GET /aperturas-bodegas/resumen?tipoConsejo=D|M` devuelve el progreso
 * global y un renglón por consejo activo del proceso (aunque esté en ceros)
 * con los conteos de aperturas abiertas y cerradas.
 */
export interface IAperturaResumenConsejo {
  tipo_consejo: 'D' | 'M';
  id_consejo: number;
  nombre_consejo: string;
  total: number;
  abiertas: number;
  cerradas: number;
}

export interface IAperturasResumenProgreso {
  total: number;
  abiertas: number;
  cerradas: number;
}

export interface IAperturasResumenData {
  progreso: IAperturasResumenProgreso;
  consejos: IAperturaResumenConsejo[];
}

/**
 * Shape plana del endpoint de detalle: la cabecera y los arrays comparten el
 * mismo nivel (sin wrapper `cabecera`). El cliente consume la cabecera directo
 * vía `IAperturaBodega`; los `*_lista` son los registros completos para los
 * cards editables.
 */
export interface IAperturaBodegaDetalleAPI extends IAperturaBodega {
  consejeros_lista?: IConsejeroAperturaAPI[];
  representantes_lista?: IRepresentanteAperturaAPI[];
  otros_lista?: IOtraPersonaAPI[];
  paquetes_lista?: IPaqueteAperturaAPI[];
}

// ─── Sub-colecciones tal como las guarda la base ─────────────────────────────
// Una apertura es el acta de un momento dado: las personas quedan guardadas
// con su nombre y cargo, sin referencia a los sistemas externos, para que el
// registro no cambie si después relevan a alguien. Por eso estos renglones no
// traen identificador de persona y `orden` es su llave dentro del acta.

export interface IConsejeroAperturaAPI {
  orden: number;
  asistencia: boolean;
  cargo: string;
  nombre: string;
}

export interface IRepresentanteAperturaAPI {
  orden: number;
  asistencia: boolean;
  cargo: string;
  nombre: string;
  id_partido: number;
  imagen: string | null;
}

export interface IOtraPersonaAPI {
  cargo: string;
  nombre: string;
  id_procedencia: number;
}

/** La columna en la base se llama `tipo_casilla`; el alta la recibe como `casilla`. */
export interface IPaqueteAperturaAPI {
  seccion: number;
  tipo_casilla: string;
  operacion?: string;
}

// ─── Sub-colecciones (payloads para POST/PUT) ────────────────────────────────

// El acta no guarda el identificador de la persona en los sistemas externos:
// una apertura registrada se lee de sí misma y no debe cambiar si después
// relevan a alguien. Dentro del acta, `orden` es la llave de cada renglón.

export interface IConsejeroApertura {
  orden: number;
  asistencia: boolean;
  cargo: string;
  nombre: string;
}

export interface IRepresentanteApertura {
  orden: number;
  asistencia: boolean;
  cargo: string;
  nombre: string;
  id_partido: number;
  imagen?: string | null;
}

export interface IOtraPersona {
  uid: string;
  cargo: string;        // texto del catálogo CARGOS_APERTURA_BODEGAS
  nombre: string;
  id_procedencia: number;
}

export interface IPaqueteApertura {
  uid: string;
  seccion: number;
  casilla: string;      // p.ej. "B1", "C1"
  casilla_desc: string; // p.ej. "BASICA", "CONTIGUA"
}

// ─── Payloads de mutación ─────────────────────────────────────────────────────

export interface IAperturaCrearPayload {
  // El backend espera `tipo_eleccion` en el body (no `bodega`). En el response
  // el mismo concepto viene como atributo `bodega` (ver `IAperturaBodega`).
  tipo_eleccion: TTipoEleccion;
  id_consejo: number;
  tipo_consejo: 'D' | 'M';
  fecha_apertura: string;       // yyyy-MM-dd
  hora_apertura: string;        // HH:mm
  motivo: string;
  observaciones?: string;
  sellos_apertura: 'true' | 'false';
  sacar_paquetes: TSacarPaquetesFront;
  consejeros: string;           // JSON serializado
  representantes: string;
  otros: string;
  paquetes: string;
}

export interface IAperturaActualizarPayload extends IAperturaCrearPayload {
  id: number;
}

export interface IAperturaCerrarPayload {
  fecha_cierre: string;
  hora_cierre: string;
  sellos_cierre: 'true' | 'false';
  // La API aún no persiste este campo en el cierre (el modelo y la función
  // de base solo reciben fecha, hora y sellos); se envía para cuando el
  // contrato lo incorpore.
  observaciones?: string;
}

// ─── Historial ────────────────────────────────────────────────────────────────

export interface IAperturaHistorialItem {
  fecha_reg: string;
  accion: string;
  usuario: string;
  detalle: string | null;
}

export interface IAperturaHistorialPayload {
  data: IAperturaHistorialItem[];
  meta?: Record<string, unknown>;
}
