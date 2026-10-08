'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export type TSeccionGenerador =
  | 'reunion'
  | 'traslado'
  | 'participantes'
  | 'fotografias';

/** Lo que falta en una sección: 0 = completa. */
export interface IEstadoSeccion {
  id: TSeccionGenerador;
  titulo: string;
  /** Una línea con lo capturado, visible con la sección plegada. */
  resumen: string;
  pendientes: number;
}

/** Texto del estado: «Completa» o «Faltan N». */
export function textoPendientes(pendientes: number) {
  return pendientes === 0
    ? 'Completa'
    : `${pendientes === 1 ? 'Falta' : 'Faltan'} ${pendientes}`;
}

export function EstadoSeccionIcono({ pendientes }: { pendientes: number }) {
  return pendientes === 0 ? (
    <CheckCircle2
      className="h-4 w-4 shrink-0 text-success"
      aria-hidden="true"
    />
  ) : (
    <AlertTriangle
      className="h-4 w-4 shrink-0 text-warning"
      aria-hidden="true"
    />
  );
}

interface SeccionGeneradorProps {
  estado: IEstadoSeccion;
  abierta: boolean;
  onAbiertaChange: (abierta: boolean) => void;
  /** Control junto al título que no despliega la sección (p. ej. el interruptor de custodia). */
  accion?: ReactNode;
  children: ReactNode;
}

/**
 * Tarjeta plegable del generador: plegada muestra el título, un resumen de lo
 * capturado y si está completa o cuánto le falta, para recorrer el acta sin
 * desplazarse por todos los campos.
 */
export function SeccionGenerador({
  estado,
  abierta,
  onAbiertaChange,
  accion,
  children,
}: SeccionGeneradorProps) {
  const { id, titulo, resumen, pendientes } = estado;
  return (
    <Collapsible open={abierta} onOpenChange={onAbiertaChange} asChild>
      <section
        id={`seccion-${id}`}
        aria-labelledby={`seccion-${id}-titulo`}
        className="scroll-mt-2 rounded-lg border border-border bg-card"
      >
        <div
          className={[
            'flex items-center gap-3 pr-4',
            abierta ? 'border-b border-border' : '',
          ].join(' ')}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/30"
            >
              <ChevronDown
                className={[
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
                  abierta ? '' : '-rotate-90',
                ].join(' ')}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span
                  id={`seccion-${id}-titulo`}
                  className="block text-sm font-semibold text-foreground"
                >
                  {titulo}
                </span>
                {!abierta && resumen && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {resumen}
                  </span>
                )}
              </span>
              <span
                className={[
                  'flex shrink-0 items-center gap-1.5 text-xs font-medium',
                  pendientes === 0 ? 'text-success' : 'text-warning',
                ].join(' ')}
              >
                <EstadoSeccionIcono pendientes={pendientes} />
                {textoPendientes(pendientes)}
              </span>
            </button>
          </CollapsibleTrigger>
          {accion}
        </div>
        <CollapsibleContent>
          <div className="space-y-4 p-4">{children}</div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
