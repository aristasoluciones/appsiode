'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import type { IMarcoGeografico } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import type { TMecanismoForm } from '../_lib/mecanismo-form';

/** El territorio de la casilla viaja como «id_mun-id_dl» para un solo selector. */
function territorioClave(r: Pick<IMarcoGeografico, 'id_mun' | 'id_dl'>) {
  return `${r.id_mun}-${r.id_dl}`;
}

interface CasillasEditorProps {
  form: UseFormReturn<TMecanismoForm>;
  /** Municipios y distritos locales del distrito federal elegido. */
  territorios: IMarcoGeografico[];
  disabled?: boolean;
}

/**
 * Casillas del mecanismo: sección, tipo (nomenclatura del INE) y el municipio
 * con su distrito local, porque la casilla dice de qué consejo es la rebanada
 * dentro de la ruta compartida.
 */
export function CasillasEditor({
  form,
  territorios,
  disabled,
}: CasillasEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'casillas',
  });

  const tope = fields.length >= MECANISMOS_LIMITES.casillas.max;

  return (
    <div className="space-y-2">
      {fields.length > 0 && (
        <div className="hidden sm:grid grid-cols-[6rem_7rem_1fr_2.5rem] gap-2 text-xs font-medium text-muted-foreground px-1">
          <span>Sección</span>
          <span>Tipo</span>
          <span>Municipio · distrito local</span>
          <span />
        </div>
      )}

      {fields.map((campo, i) => (
        <div
          key={campo.id}
          className="grid grid-cols-2 sm:grid-cols-[6rem_7rem_1fr_2.5rem] gap-2 items-start"
        >
          <FormField
            control={form.control}
            name={`casillas.${i}.seccion` as const}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={String(field.value ?? '')}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={99999}
                    placeholder="Sección"
                    aria-label={`Sección de la casilla ${i + 1}`}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`casillas.${i}.casilla_tipo` as const}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={String(field.value ?? '')}
                    placeholder="B1, C1, E1"
                    aria-label={`Tipo de la casilla ${i + 1}`}
                    disabled={disabled}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`casillas.${i}.territorio` as const}
            render={({ field }) => (
              <FormItem className="col-span-2 sm:col-span-1">
                <Select
                  indicatorVisibility={false}
                  value={String(field.value ?? '')}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger
                      aria-label={`Municipio de la casilla ${i + 1}`}
                    >
                      <SelectValue placeholder="Municipio · distrito local" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {territorios.map((t) => (
                      <SelectItem
                        key={territorioClave(t)}
                        value={territorioClave(t)}
                      >
                        {t.municipio} · {t.dl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            aria-label={`Quitar la casilla ${i + 1}`}
            onClick={() => remove(i)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            seccion: '',
            casilla_tipo: '',
            territorio:
              territorios.length === 1 ? territorioClave(territorios[0]) : '',
          })
        }
        disabled={disabled || tope || territorios.length === 0}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar casilla
      </Button>
      {tope && (
        <p className="text-xs text-muted-foreground">
          Un mecanismo no puede atender más de {MECANISMOS_LIMITES.casillas.max}{' '}
          casillas.
        </p>
      )}
    </div>
  );
}
