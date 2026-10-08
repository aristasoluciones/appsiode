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

/** Sección con su resumen; las que tienen pendientes se abren al hidratar el acta. */
export interface IEstadoSeccion {
  id: TSeccionGenerador;
  titulo: string;
  /** Qué es la sección y qué es obligatorio; siempre visible bajo el título. */
  descripcion: string;
  /** Una línea con lo capturado, visible con la sección plegada. */
  resumen: string;
  pendientes: number;
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
  const { id, titulo, descripcion, resumen, pendientes } = estado;
  const completa = pendientes === 0;
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
                <span className="block text-xs text-muted-foreground">
                  {descripcion}
                </span>
                {!abierta && resumen && (
                  <span className="block truncate text-xs font-medium text-foreground/80"></span>
                )}
              </span>
            </button>
          </CollapsibleTrigger>
          {accion}
          {/* Siempre al final, después del control de la sección (p. ej. el interruptor
              de custodia). Solo dice si está completa; el detalle lo da cada campo. */}
          <span
            className={[
              'flex shrink-0 items-center gap-1.5 text-xs font-medium',
              completa ? 'text-success' : 'text-warning',
            ].join(' ')}
          >
            {completa ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            )}
            {completa ? 'Completa' : 'Incompleta'}
          </span>
        </div>
        <CollapsibleContent>
          <div className="space-y-4 p-4">{children}</div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
