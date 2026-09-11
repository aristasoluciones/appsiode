import type { TEstatusActa } from '@/types/material-electoral';

type TVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'destructive';

/** Etiqueta y color de cada estatus del acta, iguales en el listado y el detalle. */
export const ESTATUS_ACTA: Record<
  TEstatusActa,
  { label: string; variant: TVariant; descripcion: string }
> = {
  BORRADOR: {
    label: 'Borrador',
    variant: 'secondary',
    descripcion:
      'El generador está abierto; todavía no se ha generado el acta.',
  },
  GENERADA: {
    label: 'Generada',
    variant: 'primary',
    descripcion:
      'El Word ya se generó. Imprímelo, recaba las firmas y sube el PDF firmado.',
  },
  EN_REVISION: {
    label: 'En revisión',
    variant: 'info',
    descripcion: 'Oficina central está revisando el acta firmada.',
  },
  REQUERIDO: {
    label: 'Requerido',
    variant: 'warning',
    descripcion:
      'Oficina central envió observaciones. Corrige, regenera si hace falta y vuelve a subir el PDF firmado.',
  },
  ACEPTADA: {
    label: 'Aceptada',
    variant: 'success',
    descripcion: 'Oficina central aceptó el acta; ya no admite cambios.',
  },
  ANULADA: {
    label: 'Anulada',
    variant: 'destructive',
    descripcion:
      'Oficina central la anuló; sus renglones quedaron libres para la siguiente acta.',
  },
  DESCARTADA: {
    label: 'Descartada',
    variant: 'secondary',
    descripcion: 'El consejo la descartó; se conserva solo como registro.',
  },
};

/** Estatus cerrados: se muestran atenuados en el listado. */
export function actaCerrada(estatus: TEstatusActa): boolean {
  return estatus === 'ANULADA' || estatus === 'DESCARTADA';
}
