import type { Id } from './_shared';

export const ROLES = {
  LIST: '/Roles',
  CREATE: '/Roles',
  UPDATE: (idRol: Id) => `/Roles/${idRol}`,
  DELETE: (idRol: Id) => `/Roles/${idRol}`,
  ACCIONES: '/Roles/acciones',
  PERMISOS: (idRol: Id) => `/Roles/${idRol}/permisos`,
  TOGGLE_PERMISO: (idRol: Id, idAccion: Id) => `/Roles/${idRol}/permisos/${idAccion}`,
} as const;
