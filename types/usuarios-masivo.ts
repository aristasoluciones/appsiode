/**
 * Alta masiva de cuentas desde un archivo (xlsx o csv).
 * Contrato de `/Usuarios/masivo` — el API responde en snake_case.
 */

/** Límites que impone el API a cada carga; se validan también en pantalla. */
export const MASIVO_LIMITES = {
  /** Tamaño máximo del archivo, en bytes. */
  bytes: 2 * 1024 * 1024,
  /** Máximo de cuentas por archivo. */
  filas: 300,
  /** Extensiones admitidas. */
  extensiones: ['.xlsx', '.csv'] as const,
} as const;

/** Fila del archivo tal como la revisó el API, para la vista previa. */
export interface IMasivoFila {
  fila: number;
  nombre: string;
  paterno: string;
  materno: string;
  correo: string;
  /** Etiqueta legible: «Consejo» u «Oficina Central». */
  tipo: string;
  /** Etiqueta legible: «Distrital», «Municipal» o vacío. */
  tipo_consejo: string;
  /** Consejo ya resuelto contra el catálogo: «01 TUXTLA GUTIÉRREZ». */
  consejo: string;
  rol: string;
  valida: boolean;
  errores: string[];
}

/** Vista previa completa del archivo, antes de crear nada. */
export interface IMasivoValidacion {
  total: number;
  validas: number;
  rechazadas: number;
  filas: IMasivoFila[];
}

/** Cuenta creada. La contraseña inicial solo viaja en el acuse. */
export interface IMasivoCreada {
  fila: number;
  nombre: string;
  correo: string;
  password: string;
  rol: string;
  tipo: string;
  consejo: string;
}

/** Fila que no se dio de alta, con el motivo que se muestra y se imprime. */
export interface IMasivoRechazada {
  fila: number;
  nombre: string;
  correo: string;
  motivo: string;
}

/** Acuse en Excel que la pantalla descarga en automático al terminar. */
export interface IMasivoAcuse {
  nombre_archivo: string;
  contenido_base64: string;
}

/** Resultado del alta masiva. */
export interface IMasivoResultado {
  total: number;
  creadas: IMasivoCreada[];
  rechazadas: IMasivoRechazada[];
  acuse: IMasivoAcuse;
}
