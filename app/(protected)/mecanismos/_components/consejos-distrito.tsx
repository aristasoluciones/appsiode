'use client';

import { useMemo, useState } from 'react';
import type { IMarcoGeografico } from '@/types/mecanismos';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ConteoChip } from '@/components/common/chip-filtro';
import { useMarcoGeografico } from '../_hooks/use-mecanismos';

interface IConsejoDelDistrito {
  clave: string;
  nombre: string;
}

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * Consejos de un distrito federal según el marco geográfico: el distrital de
 * cada distrito local y el municipal de cada municipio, sin repetir y en orden.
 */
function consejosDelDistrito(marco: IMarcoGeografico[], idDf: number) {
  const d = new Map<number, IConsejoDelDistrito>();
  const m = new Map<number, IConsejoDelDistrito>();
  for (const t of marco) {
    if (t.id_df !== idDf) continue;
    d.set(t.id_dl, { clave: `CDE.${dos(t.id_dl)}`, nombre: t.dl });
    m.set(t.id_mun, { clave: `CME.${dos(t.id_mun)}`, nombre: t.municipio });
  }
  const ordenar = (x: Map<number, IConsejoDelDistrito>) =>
    Array.from(x.entries())
      .sort(([a], [b]) => a - b)
      .map(([, c]) => c);
  return { distritales: ordenar(d), municipales: ordenar(m) };
}

function Grupo({
  titulo,
  consejos,
}: {
  titulo: string;
  consejos: IConsejoDelDistrito[];
}) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground">
        {titulo} ({consejos.length})
      </p>
      <ul className="space-y-0.5 text-sm">
        {consejos.map((c) => (
          <li key={c.clave} className="flex gap-2 min-w-0">
            <span className="font-mono text-xs text-muted-foreground shrink-0 pt-0.5">
              {c.clave}
            </span>
            <span className="truncate" title={c.nombre}>
              {c.nombre}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Lista de los consejos distritales y municipales de un distrito federal, con
 * clave y nombre y scroll si son muchos. Pide el marco geográfico solo al
 * montarse (al abrir la ventana o elegir el distrito).
 */
export function ListaConsejosDistrito({ idDf }: { idDf: number }) {
  const { data: marco, isLoading } = useMarcoGeografico(true);
  const consejos = useMemo(
    () => consejosDelDistrito(marco ?? [], idDf),
    [marco, idDf],
  );

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }
  if (consejos.distritales.length + consejos.municipales.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        El marco geográfico no tiene consejos para este distrito federal.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
      <Grupo titulo="Distritales" consejos={consejos.distritales} />
      <Grupo titulo="Municipales" consejos={consejos.municipales} />
    </div>
  );
}

/**
 * Chips «Distritales (n) · Municipales (m)» del distrito que, al hacer clic,
 * abren la lista de esos consejos con su clave y nombre.
 */
export function ConsejosDistritoPopover({
  idDf,
  df,
  distritales,
  municipales,
}: {
  idDf: number;
  df: string;
  distritales: number;
  municipales: number;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap gap-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
          aria-label={`Ver los consejos del distrito federal ${idDf}`}
          title="Ver los consejos del distrito"
        >
          {(
            [
              ['Distritales', distritales],
              ['Municipales', municipales],
            ] as const
          ).map(([etiqueta, n]) => (
            <span
              key={etiqueta}
              className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-border bg-background text-xs text-muted-foreground whitespace-nowrap hover:border-primary hover:text-primary"
            >
              {etiqueta}
              <ConteoChip>{n}</ConteoChip>
            </span>
          ))}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(32rem,90vw)] space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Distrito federal {idDf}
          </p>
          <p className="text-sm font-semibold text-foreground">
            Consejos de {df}
          </p>
        </div>
        {abierto && <ListaConsejosDistrito idDf={idDf} />}
      </PopoverContent>
    </Popover>
  );
}

/** Una sección de la lista amplia: encabezado fijo y un renglón por consejo, con su clave en pastilla. */
function SeccionAmplia({
  titulo,
  consejos,
}: {
  titulo: string;
  consejos: IConsejoDelDistrito[];
}) {
  if (consejos.length === 0) return null;
  return (
    <section>
      <h4 className="sticky top-0 z-10 flex items-center justify-between bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">
        {titulo}
        <ConteoChip>{consejos.length}</ConteoChip>
      </h4>
      <ul className="divide-y divide-border">
        {consejos.map((c) => (
          <li key={c.clave} className="flex items-center gap-2 px-3 py-1.5">
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              {c.clave}
            </span>
            <span className="text-sm text-foreground">{c.nombre}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Consejos que revisarán la propuesta, para la columna de la ventana de
 * proponer: resumen arriba y la lista con todo el alto disponible y scroll
 * propio. Sin distrito elegido, explica qué aparecerá.
 */
export function ConsejosQueRevisaran({ idDf }: { idDf: number | null }) {
  const { data: marco, isLoading } = useMarcoGeografico(idDf != null);
  const consejos = useMemo(
    () =>
      idDf != null
        ? consejosDelDistrito(marco ?? [], idDf)
        : { distritales: [], municipales: [] },
    [marco, idDf],
  );
  const total = consejos.distritales.length + consejos.municipales.length;

  return (
    <div className="flex flex-col min-h-0 h-full rounded-md border border-border bg-card overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border bg-muted/30">
        <p className="text-sm font-medium text-foreground">
          Consejos que revisarán esta propuesta
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {idDf == null
            ? 'Elige el distrito federal para ver quiénes la recibirán.'
            : isLoading
              ? 'Cargando los consejos del distrito…'
              : `${total} ${total === 1 ? 'consejo' : 'consejos'}: ${consejos.distritales.length} distritales y ${consejos.municipales.length} municipales.`}
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {idDf == null ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Aquí aparecerá la lista de consejos distritales y municipales, con
            su clave y nombre.
          </p>
        ) : isLoading ? (
          <div className="p-3 space-y-2" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            El marco geográfico no tiene consejos para este distrito federal.
          </p>
        ) : (
          <>
            <SeccionAmplia
              titulo="Distritales"
              consejos={consejos.distritales}
            />
            <SeccionAmplia
              titulo="Municipales"
              consejos={consejos.municipales}
            />
          </>
        )}
      </div>
    </div>
  );
}
