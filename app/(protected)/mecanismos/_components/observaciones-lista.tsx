'use client';

import { CheckCircle2, MessageSquareText } from 'lucide-react';
import type { IMecanismoObservacion } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TextoExpandible } from '@/components/common/texto-expandible';
import {
  TIPO_OBSERVACION_CORTO,
  TIPO_SIN_OBSERVACIONES,
} from '../_lib/estatus';

interface ObservacionesListaProps {
  /** Indefinidas mientras carga el detalle; vacías cuando no hay ninguna. */
  observaciones: IMecanismoObservacion[] | undefined;
  titulo?: string;
  vacio?: string;
}

/**
 * Observaciones del consejo que informa, de la más reciente a la más antigua:
 * tipo, texto, quién y cuándo, y la marca de la que informó el mecanismo.
 */
export function ObservacionesLista({
  observaciones,
  titulo = 'Observaciones registradas',
  vacio = 'Todavía no hay observaciones registradas.',
}: ObservacionesListaProps) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageSquareText
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        {titulo}
        {observaciones && (
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            ({observaciones.length})
          </span>
        )}
      </h3>

      {!observaciones ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : observaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ScrollArea viewportClassName="max-h-72 pr-3">
          <ul className="space-y-2">
            {[...observaciones].reverse().map((o) => (
              <li
                key={o.id}
                className="rounded-md border border-border p-3 space-y-1.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      o.tipo === TIPO_SIN_OBSERVACIONES ? 'secondary' : 'info'
                    }
                    appearance="light"
                    size="sm"
                  >
                    {o.tipo_desc || TIPO_OBSERVACION_CORTO[o.tipo] || o.tipo}
                  </Badge>
                  {o.informo && (
                    <Badge variant="success" appearance="light" size="sm">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Informó el mecanismo
                    </Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatFechaHora(o.fecha)}
                  </span>
                </div>
                {o.observaciones && (
                  <p className="text-sm text-foreground text-justify whitespace-pre-line">
                    <TextoExpandible texto={o.observaciones} />
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {o.usuario || 'Sistema'}
                </p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
