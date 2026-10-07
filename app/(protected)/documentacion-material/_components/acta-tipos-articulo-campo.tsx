'use client';

import type { Control, FieldValues, Path } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import type { IActaTipoOpcion } from '../_hooks/use-tipos-acta';

interface ActaTiposArticuloSelectorProps {
  opciones: IActaTipoOpcion[];
  /** Claves elegidas. */
  value: string[];
  onChange: (value: string[]) => void;
  /** Tipos que ya están en otra acta en curso: clave → número de esa acta. */
  ocupados?: Record<string, number>;
  loading?: boolean;
  /** Acta de solo lectura o cambio en curso: no se puede elegir. */
  disabled?: boolean;
}

/**
 * Casillas de los tipos de artículo del acta (documentación, boletas, material
 * o la combinación que se elija). Un tipo que ya está en otra acta en curso
 * aparece deshabilitado con el número del acta que lo tiene.
 */
export function ActaTiposArticuloSelector({
  opciones,
  value,
  onChange,
  ocupados = {},
  loading = false,
  disabled = false,
}: ActaTiposArticuloSelectorProps) {
  if (loading) {
    return (
      <div className="grid gap-2 sm:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (opciones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        El consejo todavía no tiene documentación ni material cargado.
      </p>
    );
  }

  return (
    <div
      role="group"
      aria-label="Tipos de artículo del acta"
      className="grid gap-2 sm:grid-cols-3"
    >
      {opciones.map((o) => {
        const id = `acta-tipo-${o.clave}`;
        const marcado = value.includes(o.clave);
        const ocupadoPor = ocupados[o.clave];
        const bloqueado = disabled || (ocupadoPor != null && !marcado);
        return (
          <label
            key={o.clave}
            htmlFor={id}
            className={[
              'flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors motion-reduce:transition-none',
              marcado ? 'border-primary bg-primary/5' : 'border-border',
              bloqueado ? 'opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            <Checkbox
              id={id}
              checked={marcado}
              onCheckedChange={(v) =>
                onChange(
                  v === true
                    ? [...value, o.clave]
                    : value.filter((c) => c !== o.clave),
                )
              }
              disabled={bloqueado}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-foreground">{o.descripcion}</span>
              {ocupadoPor != null && !marcado && (
                <span className="block text-xs text-muted-foreground">
                  Ya está en el acta #{ocupadoPor}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

interface ActaTiposArticuloCampoProps<T extends FieldValues>
  extends Omit<ActaTiposArticuloSelectorProps, 'value' | 'onChange'> {
  control: Control<T>;
  name: Path<T>;
  /** Se avisa con la selección nueva cada vez que cambia. */
  onCambio?: (tipos: string[]) => void;
}

/** Campo del formulario del generador: obligatorio, con su ayuda y su mensaje. */
export function ActaTiposArticuloCampo<T extends FieldValues>({
  control,
  name,
  onCambio,
  ...selector
}: ActaTiposArticuloCampoProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Seleccione los tipos que entrarán en esta acta{' '}
            <span className="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <ActaTiposArticuloSelector
              {...selector}
              value={field.value ?? []}
              onChange={(tipos) => {
                field.onChange(tipos);
                onCambio?.(tipos);
              }}
            />
          </FormControl>
          <FormDescription>
            Solo las filas de estos tipos comprobadas hasta el corte entran al
            detalle del acta. Si una fila se modifica después, vuelve a
            reportarse en el acta cuyo corte la incluya. Un tipo solo puede
            estar en un acta en curso a la vez.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
