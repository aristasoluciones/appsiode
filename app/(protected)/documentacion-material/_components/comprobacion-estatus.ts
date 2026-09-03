import type { TEstatusComprobacion } from '@/types/material-electoral';

/** Etiqueta y color de cada estatus; el estatus lo calcula la API, no la pantalla. */
export const ESTATUS_COMPROBACION: Record<
  TEstatusComprobacion,
  {
    label: string;
    variant: 'secondary' | 'success' | 'warning' | 'destructive';
  }
> = {
  SIN_INFORMACION: { label: 'Sin información', variant: 'secondary' },
  SIN_INCONSISTENCIAS: { label: 'Sin inconsistencias', variant: 'success' },
  CON_FALTANTES: { label: 'Con faltantes', variant: 'destructive' },
  CON_EXCEDENTES: { label: 'Con excedentes', variant: 'warning' },
};

/** Orden en que se ofrecen los filtros por estatus. */
export const ESTATUS_ORDEN: TEstatusComprobacion[] = [
  'SIN_INFORMACION',
  'SIN_INCONSISTENCIAS',
  'CON_FALTANTES',
  'CON_EXCEDENTES',
];
