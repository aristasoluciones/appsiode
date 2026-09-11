'use client';

import { useMemo } from 'react';
import { AlertTriangle, SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

export interface IAsistenciaItem {
  /** Llave del renglón dentro del acta. */
  orden: number;
  nombre: string;
  /** Cargo de la consejería o partido de la representación. */
  subtitulo: string;
  asistencia: boolean;
}

interface ActaAsistenciaCardProps {
  id: string;
  titulo: string;
  items: IAsistenciaItem[];
  loading: boolean;
  /** El servicio externo no respondió: se avisa sin bloquear. */
  error?: boolean;
  readOnly: boolean;
  vacio: string;
  onToggle: (orden: number, value: boolean) => void;
  onToggleAll: (value: boolean) => void;
}

/**
 * Lista de personas convocadas con su asistencia, como en las aperturas de
 * bodega: se marca quién estuvo presente y el acta guarda a todas.
 */
export function ActaAsistenciaCard({
  id,
  titulo,
  items,
  loading,
  error = false,
  readOnly,
  vacio,
  onToggle,
  onToggleAll,
}: ActaAsistenciaCardProps) {
  const presentes = useMemo(
    () => items.reduce((s, c) => s + (c.asistencia ? 1 : 0), 0),
    [items],
  );
  const todos = items.length > 0 && presentes === items.length;
  const algunos = presentes > 0 && !todos;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {!readOnly && items.length > 0 && (
            <Checkbox
              id={`${id}-todos`}
              checked={todos ? true : algunos ? 'indeterminate' : false}
              onCheckedChange={() => onToggleAll(!todos)}
              aria-label={`Marcar asistencia de todas las ${titulo.toLowerCase()}`}
            />
          )}
          <label
            htmlFor={readOnly || items.length === 0 ? undefined : `${id}-todos`}
            className={`text-sm font-semibold text-foreground ${readOnly ? '' : 'cursor-pointer'}`}
          >
            {titulo}
          </label>
        </div>
        <Badge variant="secondary" appearance="light" size="sm">
          {presentes} / {items.length}
        </Badge>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 p-4" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
          {error ? (
            <AlertTriangle
              className="h-6 w-6 text-warning mb-2"
              aria-hidden="true"
            />
          ) : (
            <SearchX
              className="h-6 w-6 text-gray-400 mb-2"
              aria-hidden="true"
            />
          )}
          <p className="text-sm text-muted-foreground">
            {error
              ? 'No se pudo consultar el servicio externo; puedes continuar sin esta lista.'
              : vacio}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-64 overflow-y-auto">
          {items.map((c) => (
            <li key={c.orden} className="flex items-center gap-3 px-4 py-2.5">
              <Checkbox
                id={`${id}-${c.orden}`}
                checked={c.asistencia}
                onCheckedChange={() => onToggle(c.orden, !c.asistencia)}
                disabled={readOnly}
              />
              <label
                htmlFor={`${id}-${c.orden}`}
                className={`flex-1 min-w-0 ${readOnly ? '' : 'cursor-pointer'}`}
              >
                <p className="text-sm font-medium text-foreground leading-tight">
                  {c.nombre}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.subtitulo}
                </p>
              </label>
              <Badge
                variant={c.asistencia ? 'success' : 'secondary'}
                appearance="light"
                size="sm"
              >
                {c.asistencia ? 'Presente' : 'Ausente'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
