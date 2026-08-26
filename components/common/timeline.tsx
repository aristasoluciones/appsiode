'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Línea de tiempo genérica: una columna de hitos con su marcador, su título y
 * el detalle que cada módulo quiera colgar debajo. No sabe nada del dominio,
 * así que sirve igual para el historial de una cuenta, el de una apertura de
 * bodega o el seguimiento de una sesión.
 *
 * ```tsx
 * <Timeline>
 *   <TimelineItem titulo="Inicio de sesión" fecha="hoy" icono={<LogIn />} tono="info">
 *     <p className="text-xs text-muted-foreground">Desde CONSEJO-01</p>
 *   </TimelineItem>
 * </Timeline>
 * ```
 */
export function Timeline({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <ol className={cn('flex flex-col', className)}>{children}</ol>;
}

/** Colores del marcador, para distinguir de un vistazo la naturaleza del hito. */
export type TTimelineTono =
  | 'neutro'
  | 'primario'
  | 'exito'
  | 'advertencia'
  | 'peligro'
  | 'info';

// Mismos colores que los distintivos claros de Metronic, para que la pantalla
// se lea igual en tema claro y oscuro.
const TONOS: Record<TTimelineTono, string> = {
  neutro: 'bg-muted text-muted-foreground',
  primario: 'bg-primary/10 text-primary',
  exito:
    'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  advertencia:
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  peligro: 'bg-destructive/10 text-destructive',
  info: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
};

export interface TimelineItemProps {
  /** Icono del marcador; se dibuja a 16 px. */
  icono?: ReactNode;
  tono?: TTimelineTono;
  titulo: ReactNode;
  /** Momento del hito, alineado a la derecha del título. */
  fecha?: ReactNode;
  /** Detalle del hito. */
  children?: ReactNode;
  className?: string;
}

export function TimelineItem({
  icono,
  tono = 'neutro',
  titulo,
  fecha,
  children,
  className,
}: TimelineItemProps) {
  return (
    <li className={cn('group relative flex gap-3 pb-5 last:pb-0', className)}>
      {/* Hilo que une un hito con el siguiente; el último no lo dibuja. */}
      <span
        aria-hidden
        className="absolute start-[15px] top-9 bottom-0 w-px bg-border group-last:hidden"
      />
      <span
        aria-hidden
        className={cn(
          'relative z-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background [&_svg]:size-4',
          TONOS[tono],
        )}
      >
        {icono}
      </span>
      <div className="min-w-0 flex-1 space-y-1 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-sm font-medium text-foreground">{titulo}</span>
          {fecha && (
            <span className="text-xs text-muted-foreground">{fecha}</span>
          )}
        </div>
        {children}
      </div>
    </li>
  );
}
