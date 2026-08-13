import { qs, type Id } from './_shared';

export const APERTURAS_BODEGAS = {
  LIST: (tipoConsejo: string, idConsejo: Id, tipoEleccion: string) =>
    `/aperturas-bodegas${qs({ tipoConsejo, idConsejo, tipoEleccion })}`,
  // Resumen por consejo para administradores (usuarios sin consejo asignado).
  // Contrato acordado con la tarea backend del tablero; el filtro por estatus
  // se resuelve en el cliente porque el response trae ambos conteos.
  RESUMEN: (tipoConsejo: string) =>
    `/aperturas-bodegas/resumen${qs({ tipoConsejo })}`,
  DETALLE: (idApertura: Id) => `/aperturas-bodegas/${idApertura}`,
  HISTORIAL: (idApertura: Id) => `/aperturas-bodegas/${idApertura}/historial`,
  CREATE: '/aperturas-bodegas',
  UPDATE: (idApertura: Id) => `/aperturas-bodegas/${idApertura}`,
  CERRAR: (idApertura: Id) => `/aperturas-bodegas/${idApertura}/cerrar`,
  DELETE: (idApertura: Id) => `/aperturas-bodegas/${idApertura}`,
} as const;
