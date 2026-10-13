'use client';

import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
import { formatFecha } from '@/lib/fechas';
import { Progress } from '@/components/ui/progress';
import { ConteoChip } from '@/components/common/chip-filtro';

/** Consejos del distrito por tipo, en chips con su conteo. */
export function ConsejosPorTipo({ d }: { d: IEstudioAvanceDistrito }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(
        [
          ['Distritales', d.consejos_d],
          ['Municipales', d.consejos_m],
        ] as const
      ).map(([etiqueta, n]) => (
        <span
          key={etiqueta}
          className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-border bg-background text-xs text-muted-foreground whitespace-nowrap"
        >
          {etiqueta}
          <ConteoChip>{n}</ConteoChip>
        </span>
      ))}
    </div>
  );
}

/**
 * Revisiones por tipo de consejo: cuántos distritales y municipales ya
 * marcaron revisado, de su total, con una barra delgada por tipo. En verde
 * el tipo que ya revisó completo.
 */
export function RevisionesPorConsejo({ d }: { d: IEstudioAvanceDistrito }) {
  // Si el API aún no desglosa por tipo, se muestra el total para no enseñar ceros falsos.
  const sinDesglose = d.revisiones > 0 && d.revisiones_d + d.revisiones_m === 0;
  const renglones: [string, number, number][] = sinDesglose
    ? [['Consejos', d.revisiones, d.consejos]]
    : [
        ['Distritales', d.revisiones_d, d.consejos_d],
        ['Municipales', d.revisiones_m, d.consejos_m],
      ];
  return (
    <dl className="text-xs space-y-1">
      {renglones.map(([etiqueta, valor, total]) => {
        const completo = total > 0 && valor === total;
        return (
          <div
            key={etiqueta}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2"
          >
            <dt className="text-muted-foreground">{etiqueta}</dt>
            <Progress
              value={total ? Math.round((100 * valor) / total) : 0}
              className="h-1.5"
              indicatorClassName={completo ? 'bg-green-600' : 'bg-primary'}
              aria-label={`${etiqueta}: ${valor} de ${total} revisaron`}
            />
            <dd
              className={`tabular-nums font-semibold ${completo ? 'text-success' : 'text-foreground'}`}
            >
              {valor}
              <span className="font-normal text-muted-foreground">
                {' '}
                de {total}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Observaciones del distrito por tipo: una píldora por tipo, todas del ancho
 * de la columna, con el conteo a la derecha, una debajo de otra, del más observado al menos (así llegan del API). La primera va en
 * magenta; si son muchas, la celda hace scroll.
 */
export function ObservacionesPorTipo({ d }: { d: IEstudioAvanceDistrito }) {
  if (!d.id || d.observaciones_tipos.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">Sin observaciones</span>
    );
  }
  return (
    <ul className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
      {d.observaciones_tipos.map((t, i) => (
        <li
          key={t.tipo}
          title={i === 0 ? 'Tipo más observado' : undefined}
          className={[
            'flex w-full items-center justify-between gap-1.5 h-6 pl-2.5 pr-1 rounded-full border text-xs',
            i === 0
              ? 'border-primary bg-primary/10 text-primary font-medium'
              : 'border-border bg-background text-muted-foreground',
          ].join(' ')}
        >
          <span className="truncate" title={t.tipo_desc}>
            {t.tipo_desc}
          </span>
          <span
            className={[
              'shrink-0 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-semibold tabular-nums leading-none',
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            ].join(' ')}
          >
            {t.total}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Fecha de la última etapa del estudio, bajo su estatus. */
export function FechaEstudio({ d }: { d: IEstudioAvanceDistrito }) {
  const fecha = d.fecha_aprobacion ?? d.fecha_propuesta;
  if (!fecha) return null;
  return (
    <p className="text-[0.6875rem] text-muted-foreground tabular-nums mt-0.5">
      {formatFecha(fecha)}
    </p>
  );
}
