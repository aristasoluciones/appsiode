'use client';

import { useMemo, useState } from 'react';
import { Search, Undo2, X } from 'lucide-react';
import type { IEstudio, IEstudioRevisionConsejo } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nombreConsejo } from '../_lib/estatus';
import { RevisionBadge } from './estudio-badges';
import { ObservacionesLista } from './observaciones-lista';

function Fecha({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="text-sm text-foreground">
        {valor ? formatFechaHora(valor) : '—'}
      </p>
    </div>
  );
}

interface EstudioDetalleCuerpoProps {
  e: IEstudio;
  /** Oficina central con permiso: revoca la revisión de un consejo mientras el estudio esté propuesto. */
  onRevocar?: (estudio: IEstudio, consejo: IEstudioRevisionConsejo) => void;
}

/**
 * Contenido del detalle del estudio, sin historial: fechas y la revisión de
 * cada consejo (o solo la propia) con sus observaciones plegables. Lo usan el
 * panel lateral de oficina central y la ventana del consejo.
 */
export function EstudioDetalleCuerpo({
  e,
  onRevocar,
}: EstudioDetalleCuerpoProps) {
  const [busqueda, setBusqueda] = useState('');
  // Búsqueda por nombre, número o tipo («distrital», «municipal»), sobre lo recibido.
  const consejos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return e.consejos;
    return e.consejos.filter((c) =>
      nombreConsejo(c.tipo_consejo, c.id_consejo, c.consejo)
        .toLowerCase()
        .includes(q),
    );
  }, [e.consejos, busqueda]);

  return (
    <>
      <section className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Fecha etiqueta="Propuesto" valor={e.fecha_propuesta} />
          <Fecha etiqueta="Aprobado" valor={e.fecha_aprobacion} />
          <Fecha etiqueta="Anulado" valor={e.fecha_anulacion} />
        </div>
        {e.motivo_anulacion && (
          <p className="text-sm text-destructive">
            Motivo de anulación: {e.motivo_anulacion}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          {e.consejos.length === 1
            ? 'Revisión del consejo'
            : `Revisión por consejo · ${e.revisiones} de ${e.total_consejos}`}
        </h3>
        {e.consejos.length > 1 && (
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              value={busqueda}
              onChange={(ev) => setBusqueda(ev.target.value)}
              placeholder="Buscar consejo por nombre, número o tipo..."
              className="pl-9 pr-9"
              aria-label="Buscar consejo"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
        {consejos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ningún consejo coincide con «{busqueda.trim()}».
          </p>
        )}
        <div className="space-y-2">
          {consejos.map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-border p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {nombreConsejo(c.tipo_consejo, c.id_consejo, c.consejo)}
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {c.fecha_revision && (
                    <span className="text-xs text-muted-foreground">
                      {formatFechaHora(c.fecha_revision)}
                      {c.usuario_revision && ` · ${c.usuario_revision}`}
                    </span>
                  )}
                  <RevisionBadge estatus={c.estatus_revision} />
                </div>
              </div>
              <ObservacionesLista
                observaciones={c.observaciones}
                titulo="Observaciones"
                vacio="Sin observaciones registradas."
                colapsable
              />
              {onRevocar &&
                e.estatus === 'PROPUESTO' &&
                c.estatus_revision === 'REVISADO' && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRevocar(e, c)}
                    >
                      <Undo2 className="h-4 w-4" aria-hidden="true" />
                      Revocar revisión
                    </Button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
