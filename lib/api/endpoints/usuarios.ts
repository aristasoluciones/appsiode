import { qs, type Id } from './_shared';

export const USUARIOS = {
  LIST: '/Usuarios',
  CREATE: '/Usuarios',
  FORM: '/Usuarios/form',
  BY_ROL: (idRol: Id) => `/Usuarios/rol/${idRol}`,
  UPDATE: (idUsuario: Id) => `/Usuarios/${idUsuario}`,
  DELETE: (idUsuario: Id) => `/Usuarios/${idUsuario}`,
  /** Estado del segundo paso (MFA) de todas las cuentas activas. */
  MFA_ESTADOS: '/Usuarios/mfa',
  /** Borra el enrolamiento y los códigos de respaldo; el usuario vuelve a enrolar. */
  MFA_RESETEAR: (idUsuario: Id) => `/Usuarios/${idUsuario}/mfa/resetear`,
  /** Exige o libera el segundo paso para la cuenta. */
  MFA_EXIGENCIA: (idUsuario: Id) => `/Usuarios/${idUsuario}/mfa/exigencia`,

  /** Historial de una cuenta, paginado y con filtro por tipo o categoría. */
  HISTORIAL: (
    idUsuario: Id,
    pagina?: number,
    tamanio?: number,
    tipo?: string | null,
  ) => `/Usuarios/${idUsuario}/historial${qs({ pagina, tamanio, tipo })}`,
  /** Catálogo de tipos de evento con el que las pantallas arman su filtro. */
  HISTORIAL_TIPOS: '/Usuarios/historial/tipos',

  /** Formato de captura (xlsx) del alta masiva, con sus listas desplegables. */
  MASIVO_LAYOUT: '/Usuarios/masivo/layout',
  /** Revisa el archivo y devuelve la vista previa fila por fila, sin crear nada. */
  MASIVO_VALIDAR: '/Usuarios/masivo/validar',
  /** Crea las cuentas válidas del archivo y devuelve el acuse con sus contraseñas. */
  MASIVO_CREAR: '/Usuarios/masivo',

  /** Sesiones abiertas de una cuenta. */
  SESIONES: (idUsuario: Id) => `/Usuarios/${idUsuario}/sesiones`,
  /** Cierra una sesión concreta de la cuenta. */
  SESION: (idUsuario: Id, idSesion: string) =>
    `/Usuarios/${idUsuario}/sesiones/${idSesion}`,
} as const;
