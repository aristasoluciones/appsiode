import { qs, type Id } from './_shared';

export const APERTURAS_BODEGAS = {
  LIST: (tipoConsejo: string, idConsejo: Id, tipoEleccion: string) =>
    `/aperturas-bodegas${qs({ tipoConsejo, idConsejo, tipoEleccion })}`,
  DETALLE: (idApertura: Id) => `/aperturas-bodegas/${idApertura}`,
  HISTORIAL: (idApertura: Id) => `/aperturas-bodegas/${idApertura}/historial`,
  CREATE: '/aperturas-bodegas',
  UPDATE: (idApertura: Id) => `/aperturas-bodegas/${idApertura}`,
  CERRAR: (idApertura: Id) => `/aperturas-bodegas/${idApertura}/cerrar`,
  DELETE: (idApertura: Id) => `/aperturas-bodegas/${idApertura}`,
} as const;
