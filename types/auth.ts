import { IProceso } from './proceso';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  idRol: string;
  idProceso: string;
  idConsejo: string;
  tipoConsejo: string;
  tipoConsejoDesc: string;
  claveConsejo: string;
  consejo: string;
  modulos: string[];
  proceso?: IProceso | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
}

/** Método con el que la cuenta completa el segundo paso. */
export type TMfaMetodo = 'app' | 'correo';

/** Reto temporal que devuelve el login cuando la cuenta exige el segundo paso. */
export interface IMfaReto {
  reto: string;
  metodo: TMfaMetodo;
}

/** Respuesta del login cuando se requiere el segundo paso (viaja en `data`). */
export interface IMfaLoginData {
  mfaRequerido: boolean;
  reto: string;
  metodo: TMfaMetodo;
}

/** Estado del segundo paso de la propia cuenta (GET /Auth/mfa/estado). */
export interface IMfaEstado {
  /** El enrolamiento está confirmado y el segundo paso opera. */
  activo: boolean;
  /** Hay un enrolamiento generado que aún no se confirma con un código. */
  pendiente: boolean;
  /** La administración exige el segundo paso a esta cuenta. */
  exigido: boolean;
  codigosRespaldoRestantes: number;
}

/** Datos para enrolar la app autenticadora (POST /Auth/mfa/enrolar). */
export interface IMfaEnrolamiento {
  /** Secreto en Base32 para capturar a mano en la app. */
  secreto: string;
  /** Liga estándar otpauth:// con la que se dibuja el código QR. */
  otpauthUri: string;
}

/** Sesión abierta de la propia cuenta (GET /auth/sesiones). */
export interface ISesionActiva {
  id_sesion: string;
  /** Nombre del equipo con el que se abrió la sesión. */
  dispositivo: string;
  /** Dirección de origen desde la que se inició. */
  ip_origen: string | null;
  fecha_inicio: string;
  fecha_ultimo_uso: string;
  fecha_expira: string;
  /** Es la sesión desde la que se hace la consulta. */
  actual: boolean;
}

/** Equipo de confianza del segundo paso (GET /auth/mfa/dispositivos). */
export interface IDispositivoConfianza {
  id_dispositivo: string;
  dispositivo: string;
  ip_origen: string | null;
  fecha_registro: string;
  fecha_ultimo_uso: string;
  /** Fin del plazo de confianza: al vencer vuelve a pedirse el código. */
  fecha_expira: string;
  /** Es el equipo desde el que se hace la consulta. */
  actual: boolean;
}

/** Tipo de evento del historial de una cuenta (catálogo del filtro). */
export interface IEventoTipo {
  /** Clave del evento, por ejemplo «sesion.inicio». */
  clave: string;
  titulo: string;
  /** Agrupador: cuenta, contrasenia, sesion o mfa. */
  categoria: string;
}

/** Evento del historial de una cuenta: qué pasó, quién lo hizo y desde dónde. */
export interface IEventoCuenta {
  id: number;
  tipo: string;
  tipo_titulo: string;
  categoria: string;
  fecha: string;
  /** Equipo desde el que se hizo, cuando quedó registrado. */
  dispositivo: string | null;
  ip: string | null;
  /** Datos propios del evento (rol anterior y nuevo, origen del cambio…). */
  detalle: Record<string, unknown> | null;
  id_actor: number | null;
  actor_usuario: string | null;
  actor_nombre: string | null;
  /** El evento lo provocó el propio titular de la cuenta. */
  actor_es_titular: boolean;
}

/** Página del historial de una cuenta. */
export interface IHistorialCuenta {
  total: number;
  pagina: number;
  tamanio: number;
  paginas: number;
  eventos: IEventoCuenta[];
}
