import type { Id } from './_shared';

export const USUARIOS = {
  LIST: '/Usuarios',
  CREATE: '/Usuarios',
  FORM: '/Usuarios/form',
  BY_ROL: (idRol: Id) => `/Usuarios/rol/${idRol}`,
  UPDATE: (idUsuario: Id) => `/Usuarios/${idUsuario}`,
  DELETE: (idUsuario: Id) => `/Usuarios/${idUsuario}`,
} as const;
