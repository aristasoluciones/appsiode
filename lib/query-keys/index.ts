// Llaves de caché de TanStack Query — fuente única para queries e invalidaciones.
// Un archivo por dominio; este barrel los agrupa en `QUERY_KEYS`.
// Para agregar un dominio: crea `<dominio>.ts` exportando su objeto `as const` y regístralo aquí.
//
// Regla: ninguna llave se escribe a mano en un componente o hook — siempre se toma
// de aquí, para que una query y su invalidación no puedan desalinearse.
import { APERTURAS_KEYS } from './aperturas-bodegas';
import { AUTH_KEYS } from './auth';
import { BODEGAS_KEYS, VERIFICACIONES_KEYS } from './bodegas';
import { CATALOGOS_KEYS } from './catalogos';
import { EXTERNOS_KEYS } from './externos';
import { PROCESOS_KEYS } from './procesos';
import { ROLES_KEYS } from './roles';
import { SESIONES_KEYS } from './sesiones';
import { USUARIOS_KEYS } from './usuarios';

export const QUERY_KEYS = {
  AUTH: AUTH_KEYS,
  CATALOGOS: CATALOGOS_KEYS,
  USUARIOS: USUARIOS_KEYS,
  ROLES: ROLES_KEYS,
  PROCESOS: PROCESOS_KEYS,
  SESIONES: SESIONES_KEYS,
  BODEGAS: BODEGAS_KEYS,
  VERIFICACIONES: VERIFICACIONES_KEYS,
  APERTURAS_BODEGAS: APERTURAS_KEYS,
  EXTERNOS: EXTERNOS_KEYS,
} as const;

export {
  APERTURAS_KEYS,
  AUTH_KEYS,
  BODEGAS_KEYS,
  CATALOGOS_KEYS,
  EXTERNOS_KEYS,
  PROCESOS_KEYS,
  ROLES_KEYS,
  SESIONES_KEYS,
  USUARIOS_KEYS,
  VERIFICACIONES_KEYS,
};
export type { KeyId } from './_shared';
