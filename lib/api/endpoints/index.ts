// Endpoints del API .NET — usados con apiClient y authClient (browser directo).
// Un archivo por módulo; este barrel los agrupa en `API_ENDPOINTS`.
// Para agregar un módulo: crea `<modulo>.ts` exportando su objeto `as const` y regístralo aquí.
import { APERTURAS_BODEGAS } from './aperturas-bodegas';
import { AUTH } from './auth';
import { BODEGAS } from './bodegas';
import { CATALOGOS } from './catalogos';
import { MATERIAL_ELECTORAL } from './material-electoral';
import { PROCESOS } from './procesos';
import { ROLES } from './roles';
import { SESIONES } from './sesiones';
import { USUARIOS } from './usuarios';

export const API_ENDPOINTS = {
  CATALOGOS,
  AUTH,
  USUARIOS,
  ROLES,
  PROCESOS,
  SESIONES,
  BODEGAS,
  APERTURAS_BODEGAS,
  MATERIAL_ELECTORAL,
} as const;

export { APERTURAS_BODEGAS, AUTH, BODEGAS, CATALOGOS, MATERIAL_ELECTORAL, PROCESOS, ROLES, SESIONES, USUARIOS };
export type { Id } from './_shared';
