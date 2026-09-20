'use client';

import { useMemo } from 'react';
import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface EstudiosAvanceResumenProps {
  /** Distritos ya filtrados: los indicadores se calculan sobre lo que se ve. */
  distritos: IEstudioAvanceDistrito[];
  total: number;
  isLoading: boolean;
}

function Barra({
  etiqueta,
  valor,
  total,
  color,
}: {
  etiqueta: string;
  valor: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((100 * valor) / total) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{etiqueta}</span>
        <span className="text-muted-foreground tabular-nums">
          {valor} de {total} · {pct}%
        </span>
      </div>
      <Progress
        value={pct}
        className="h-2"
        indicatorClassName={color}
        aria-label={etiqueta}
      />
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
      <span className="block text-muted-foreground">{etiqueta}</span>
      <span className="font-semibold text-foreground tabular-nums">
        {valor}
      </span>
    </div>
  );
}

/** Avance de los estudios: barras de cargados y validados más los indicadores, recalculados sobre lo filtrado. */
export function EstudiosAvanceResumen({
  distritos,
  total,
  isLoading,
}: EstudiosAvanceResumenProps) {
  const r = useMemo(() => {
    const cargados = distritos.filter((d) => d.cargado).length;
    const validados = distritos.filter((d) => d.validado).length;
    const consejos = distritos.reduce((t, d) => t + d.consejos, 0);
    const acuses1 = distritos.reduce((t, d) => t + d.acuses_etapa1, 0);
    const acuses2 = distritos.reduce((t, d) => t + d.acuses_etapa2, 0);
    const pct = (v: number, t: number) => (t ? Math.round((100 * v) / t) : 0);
    return {
      cargados,
      validados,
      consejos,
      acuses1: `${acuses1} de ${consejos} (${pct(acuses1, consejos)}%)`,
      acuses2: `${acuses2} de ${consejos} (${pct(acuses2, consejos)}%)`,
      cerrados: distritos.filter((d) => d.estatus === 'CERRADO').length,
      sinEstudio: distritos.filter((d) => !d.cargado).length,
    };
  }, [distritos]);

  if (isLoading) {
    return (
      <div
        className="rounded-lg border border-border bg-card p-4 space-y-4"
        aria-busy="true"
      >
        <Skeleton className="h-4 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const parcial = distritos.length !== total;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Avance de los estudios de factibilidad
        </p>
        <p className="text-xs text-muted-foreground">
          {parcial
            ? `Sobre ${distritos.length} de ${total} distritos federales (filtrados)`
            : `Sobre los ${total} distritos federales`}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Barra
          etiqueta="Estudios cargados"
          valor={r.cargados}
          total={distritos.length}
          color="bg-primary"
        />
        <Barra
          etiqueta="Estudios validados"
          valor={r.validados}
          total={distritos.length}
          color="bg-green-600"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Cifra etiqueta="Acuses de la propuesta" valor={r.acuses1} />
        <Cifra etiqueta="Acuses de la aprobación" valor={r.acuses2} />
        <Cifra etiqueta="Estudios cerrados" valor={r.cerrados} />
        <Cifra etiqueta="Sin estudio" valor={r.sinEstudio} />
      </div>
    </div>
  );
}
