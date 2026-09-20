'use client';

import { Badge } from '@/components/ui/badge';

export interface ICargaCifra {
  etiqueta: string;
  valor: number;
  /** Resalta el número cuando importa: rechazados en rojo, nuevos en verde. */
  tono?: 'exito' | 'peligro' | 'advertencia';
}

const TONO: Record<NonNullable<ICargaCifra['tono']>, string> = {
  exito: 'text-green-700 dark:text-green-400',
  peligro: 'text-destructive',
  advertencia: 'text-amber-700 dark:text-amber-400',
};

/** Cifras de una vista previa o de un resultado de carga, en mosaico. */
export function CargaResumen({ cifras }: { cifras: ICargaCifra[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      {cifras.map((c) => (
        <div key={c.etiqueta} className="rounded-md bg-muted/50 px-3 py-2">
          <span className="block text-muted-foreground">{c.etiqueta}</span>
          <span
            className={[
              'font-semibold tabular-nums',
              c.tono && c.valor > 0 ? TONO[c.tono] : 'text-foreground',
            ].join(' ')}
          >
            {c.valor.toLocaleString('es-MX')}
          </span>
        </div>
      ))}
    </div>
  );
}

const EFECTO: Record<
  string,
  {
    label: string;
    variant: 'success' | 'info' | 'secondary' | 'destructive' | 'warning';
  }
> = {
  NUEVO: { label: 'Nuevo', variant: 'success' },
  ACTUALIZA: { label: 'Con cambios', variant: 'info' },
  ACTUALIZADO: { label: 'Actualizado', variant: 'info' },
  SIN_CAMBIOS: { label: 'Sin cambios', variant: 'secondary' },
  RECHAZADO: { label: 'Rechazado', variant: 'destructive' },
  ASIGNA: { label: 'Asigna', variant: 'success' },
  RETIRA: { label: 'Retira', variant: 'warning' },
  PROPONE: { label: 'Propone', variant: 'success' },
  REEMPLAZA: { label: 'Reemplaza', variant: 'info' },
};

/** Efecto de un renglón de carga sobre la base (nuevo, con cambios, rechazado...). */
export function EfectoBadge({ efecto }: { efecto: string }) {
  const e = EFECTO[efecto] ?? { label: efecto, variant: 'secondary' as const };
  return (
    <Badge variant={e.variant} appearance="light" size="sm">
      {e.label}
    </Badge>
  );
}
