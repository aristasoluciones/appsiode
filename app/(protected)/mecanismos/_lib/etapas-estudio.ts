import type { IEstudioAvanceDistrito } from '@/types/mecanismos';

/**
 * Etapa del estudio de un distrito para oficina central. Distingue, dentro de
 * «Propuesto», el que espera a los consejos del que ya espera a oficina
 * central (todos revisaron): ese es el que pide acción.
 */
export type TEtapaEstudio =
  | 'SIN_ESTUDIO'
  | 'EN_REVISION'
  | 'LISTO'
  | 'APROBADO'
  | 'ANULADO';

/** Etapas del flujo, en orden; «Anulado» va aparte, fuera del flujo. */
export const ETAPAS_FLUJO: TEtapaEstudio[] = [
  'SIN_ESTUDIO',
  'EN_REVISION',
  'LISTO',
  'APROBADO',
];

export const ETAPA_ESTUDIO: Record<
  TEtapaEstudio,
  { label: string; descripcion: string }
> = {
  SIN_ESTUDIO: {
    label: 'Sin estudio',
    descripcion: 'Falta proponer el estudio del distrito.',
  },
  EN_REVISION: {
    label: 'En revisión',
    descripcion: 'Propuesto; los consejos aún lo revisan.',
  },
  LISTO: {
    label: 'Listo para aprobar',
    descripcion: 'Todos los consejos revisaron; falta aprobarlo.',
  },
  APROBADO: {
    label: 'Aprobado',
    descripcion: 'Versión final del estudio.',
  },
  ANULADO: {
    label: 'Anulado',
    descripcion: 'Se puede volver a proponer.',
  },
};

export function etapaDe(d: IEstudioAvanceDistrito): TEtapaEstudio {
  if (!d.estatus) return 'SIN_ESTUDIO';
  if (d.estatus === 'APROBADO') return 'APROBADO';
  if (d.estatus === 'ANULADO') return 'ANULADO';
  return d.consejos > 0 && d.revisiones >= d.consejos ? 'LISTO' : 'EN_REVISION';
}

/** Lo que sigue con el distrito, en palabras: «Esperando 3 revisiones». */
export function siguientePaso(d: IEstudioAvanceDistrito): string {
  switch (etapaDe(d)) {
    case 'SIN_ESTUDIO':
      return 'Proponer el estudio';
    case 'EN_REVISION': {
      const faltan = Math.max(d.consejos - d.revisiones, 0);
      return `Esperando ${faltan} ${faltan === 1 ? 'revisión' : 'revisiones'}`;
    }
    case 'LISTO':
      return 'Aprobar el estudio';
    case 'APROBADO':
      return 'Concluido';
    case 'ANULADO':
      return 'Volver a proponer';
  }
}
