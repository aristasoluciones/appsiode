import type { Id } from './_shared';

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
} as const;
