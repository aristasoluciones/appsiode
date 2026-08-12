import { qs, type Id } from './_shared';

export const BODEGAS = {
  LIST: (tipo: string, tipoConsejo?: string, idConsejo?: Id) =>
    // idConsejo 0 equivale a "sin consejo" — se omite del query
    `/bodegas/lista${qs({ tipo, tipoConsejo, idConsejo: idConsejo || undefined })}`,
  BY_ID: (id: Id) => `/bodegas/${id}`,
  CREATE: '/bodegas/nueva',
  UPDATE: (id: Id) => `/bodegas/${id}`,
  DELETE: (id: Id) => `/bodegas/${id}`,
  ACUERDO: (id: Id) => `/bodegas/${id}/acuerdo`,
  ACUERDO_DELETE: (idBodega: Id, idAcuerdo: Id) => `/bodegas/${idBodega}/acuerdo/${idAcuerdo}`,
  FOTOGRAFIAS: (id: Id) => `/bodegas/${id}/fotografias`,
  FOTOGRAFIAS_CONFIG: '/bodegas/fotografias/config',
  FOTOGRAFIA_OBSERVAR: (idBodega: Id, idFotografia: Id) =>
    `/bodegas/${idBodega}/fotografias/${idFotografia}/observar`,
  FOTOGRAFIA_TOGGLE_STATUS: (idBodega: Id, idFotografia: Id) =>
    `/bodegas/${idBodega}/fotografias/${idFotografia}/toggle-status`,
  FOTOGRAFIA_DELETE: (idBodega: Id, idFotografia: Id) =>
    `/bodegas/${idBodega}/fotografias/${idFotografia}`,
  DASHBOARD: (tipo: string, tipoConsejo?: string) => `/bodegas/dashboard${qs({ tipo, tipoConsejo })}`,
  EXPORTAR: (tipo: string, tipoConsejo?: string) => `/bodegas/exportar${qs({ tipo, tipoConsejo })}`,
  OBSERVACIONES: (
    idBodega: Id,
    filters?: { status?: string; seccion?: string; referencia?: Id },
  ) => `/bodegas/${idBodega}/observaciones${qs({ ...filters })}`,
  CREAR_OBSERVACION: (idBodega: Id) => `/bodegas/${idBodega}/observaciones`,
  OBSERVACION_DELETE: (idBodega: Id, idObservacion: Id) =>
    `/bodegas/${idBodega}/observaciones/${idObservacion}`,
  OBSERVACION_TOGGLE_STATUS: (idBodega: Id, idObservacion: Id) =>
    `/bodegas/${idBodega}/observaciones/${idObservacion}/toggle-status`,
  DETERMINAR: (idBodega: Id) => `/bodegas/${idBodega}/determinar`,
  ENVIAR_OBSERVACIONES: (idBodega: Id) => `/bodegas/${idBodega}/enviar-observaciones`,
  SOLICITAR_VALIDACION: (idBodega: Id) => `/bodegas/${idBodega}/solicitar-validacion`,
  VERIFICACIONES_LIST: (idBodega: Id) => `/bodegas/${idBodega}/verificaciones`,
  VERIFICACION_ULTIMA: (idBodega: Id) => `/bodegas/${idBodega}/verificaciones/ultima-verificacion`,
  VERIFICACION_DETAIL: (idBodega: Id, idVerificacion: Id) =>
    `/bodegas/${idBodega}/verificaciones/${idVerificacion}`,
  VERIFICACION_CREATE: (idBodega: Id) => `/bodegas/${idBodega}/verificaciones`,
  VERIFICACION_UPDATE: (idBodega: Id, idVerificacion: Id) =>
    `/bodegas/${idBodega}/verificaciones/${idVerificacion}`,
  VERIFICACION_DELETE: (idBodega: Id, idVerificacion: Id) =>
    `/bodegas/${idBodega}/verificaciones/${idVerificacion}`,
  VERIFICACION_FINALIZAR: (idBodega: Id, idVerificacion: Id) =>
    `/bodegas/${idBodega}/verificaciones/${idVerificacion}/finalizar`,
  VERIFICACION_REVISAR: (idBodega: Id, idVerificacion: Id) =>
    `/bodegas/${idBodega}/verificaciones/${idVerificacion}/revisar`,
} as const;
