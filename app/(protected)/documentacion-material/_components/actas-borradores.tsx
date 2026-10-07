'use client';

import { AlertTriangle, ImageIcon, PencilLine } from 'lucide-react';
import type { IActaBorrador } from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { formatNumero } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActasBorradoresProps {
  borradores: IActaBorrador[];
  /** Retomar un borrador en el generador; ausente = sin permiso para registrar. */
  onRetomar?: (idActa: number) => void;
}

/**
 * Borradores del consejo, cada uno con los tipos de artículo que reserva y sus
 * fotografías. El consejo puede tener varios a la vez, mientras sus tipos no
 * se repitan.
 */
export function ActasBorradores({
  borradores,
  onRetomar,
}: ActasBorradoresProps) {
  if (borradores.length === 0) return null;
  return (
    <section aria-label="Borradores del consejo" className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        Borradores
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ({formatNumero(borradores.length)})
        </span>
      </h3>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {borradores.map((b) => (
          <li
            key={b.id}
            className="rounded-lg border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Borrador #{b.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Abierto {formatFechaHora(b.created_at)}
                </p>
              </div>
              {onRetomar && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => onRetomar(b.id)}
                >
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  Retomar
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {b.tipos_articulo?.length ? (
                b.tipos_articulo.map((t) => (
                  <Badge
                    key={t.clave}
                    variant="primary"
                    appearance="light"
                    size="sm"
                  >
                    {t.descripcion || t.clave}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Sin tipos elegidos
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {formatNumero(b.fotografias)}{' '}
                {b.fotografias === 1 ? 'fotografía' : 'fotografías'}
              </p>
              {(b.advertencias ?? []).map((a) => (
                <Tooltip key={a.codigo}>
                  <TooltipTrigger asChild>
                    {/* tabIndex para que el aviso también se lea con teclado. */}
                    <span
                      tabIndex={0}
                      className="rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    >
                      <Badge variant="warning" appearance="light" size="sm">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        {a.codigo === 'SIN_COMPROBACIONES'
                          ? 'Sin comprobaciones'
                          : 'Tipos sin comprobaciones'}
                      </Badge>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-justify">
                    {a.mensaje}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
