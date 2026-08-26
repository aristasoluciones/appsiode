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
