// ─── Tipos centralizados del módulo Aperturas de Bodegas ─────────────────────

export type TTipoEleccion = 'AYUN' | 'DIPU' | 'GOB';
export type TSacarPaquetesFront = 'NINGUNO' | 'INGRESO' | 'SALIDA';

export const TIPOS_ELECCION: TTipoEleccion[] = ['AYUN', 'DIPU', 'GOB'];

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

export interface IAperturaBodegaListaPayload {
  data: IAperturaBodega[];
  meta?: Record<string, unknown>;
}

/**
 * Shape plana del endpoint de detalle: la cabecera y los arrays comparten el
 * mismo nivel (sin wrapper `cabecera`). El cliente consume la cabecera directo
 * vía `IAperturaBodega`; los `*_lista` son los registros completos para los
 * cards editables.
 */
export interface IAperturaBodegaDetalleAPI extends IAperturaBodega {
  consejeros_lista?: IConsejeroApertura[];
  representantes_lista?: IRepresentanteApertura[];
  otros_lista?: IOtraPersona[];
  paquetes_lista?: IPaqueteApertura[];
}

// ─── Sub-colecciones (payloads para POST/PUT) ────────────────────────────────

export interface IConsejeroApertura {
  orden: number;
  asistencia: boolean;
  cargo: string;
  nombre: string;
  id_consejero?: number;
}

export interface IRepresentanteApertura {
  orden: number;
  asistencia: boolean;
  cargo: string;
  nombre: string;
  id_partido: number;
  imagen?: string | null;
  id_representante?: number;
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
