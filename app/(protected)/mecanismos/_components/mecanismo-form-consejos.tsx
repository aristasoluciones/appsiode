'use client';

import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { IMarcoGeografico } from '@/types/mecanismos';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { consejoClave, type TMecanismoForm } from '../_lib/mecanismo-form';

interface IOpcionConsejo {
  clave: string;
  nombre: string;
}

const NINGUNO = '__ninguno__';

/** Selector de un consejo entre los vinculados, para «quién informa» y «quién cotiza». */
function SelectConsejo({
  value,
  onChange,
  opciones,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: IOpcionConsejo[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value || NINGUNO}
      onValueChange={(v) => onChange(v === NINGUNO ? '' : v)}
      disabled={disabled || opciones.length === 0}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value={NINGUNO}>{placeholder}</SelectItem>
        {opciones.map((o) => (
          <SelectItem key={o.clave} value={o.clave}>
            {o.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface MecanismoFormConsejosProps {
  form: UseFormReturn<TMecanismoForm>;
  /** Municipios y distritos locales del distrito federal elegido. */
  territorios: IMarcoGeografico[];
  disabled?: boolean;
}

/**
 * Consejos vinculados al mecanismo (los municipales y distritales del
 * distrito federal), más quién informa el mecanismo y quién cotiza.
 */
export function MecanismoFormConsejos({
  form,
  territorios,
  disabled,
}: MecanismoFormConsejosProps) {
  const consejosElegidos = form.watch('consejos');

  const disponibles = useMemo(() => {
    const m = new Map<string, string>();
    const d = new Map<string, string>();
    for (const t of territorios) {
      m.set(
        consejoClave('M', t.id_mun),
        `Municipal ${t.id_mun}. ${t.municipio}`,
      );
      d.set(consejoClave('D', t.id_dl), `Distrital ${t.id_dl}. ${t.dl}`);
    }
    const aLista = (x: Map<string, string>): IOpcionConsejo[] =>
      Array.from(x, ([clave, nombre]) => ({ clave, nombre }));
    return { municipales: aLista(m), distritales: aLista(d) };
  }, [territorios]);

  const vinculados = useMemo(
    () =>
      [...disponibles.municipales, ...disponibles.distritales].filter((c) =>
        consejosElegidos.includes(c.clave),
      ),
    [disponibles, consejosElegidos],
  );

  function alternar(clave: string, marcado: boolean) {
    const actuales = form.getValues('consejos');
    form.setValue(
      'consejos',
      marcado ? [...actuales, clave] : actuales.filter((c) => c !== clave),
      { shouldValidate: form.formState.isSubmitted },
    );
    if (!marcado) {
      if (form.getValues('revisor') === clave) form.setValue('revisor', '');
      if (form.getValues('cotizacion') === clave)
        form.setValue('cotizacion', '');
    }
  }

  return (
    <>
      <FormField
        control={form.control}
        name="consejos"
        render={() => (
          <FormItem>
            <FormLabel>
              Consejos vinculados <span className="text-destructive">*</span>
            </FormLabel>
            {territorios.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Elige primero el distrito federal.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['Municipales', disponibles.municipales],
                    ['Distritales', disponibles.distritales],
                  ] as const
                ).map(([titulo, lista]) => (
                  <div
                    key={titulo}
                    className="rounded-md border border-border p-3 space-y-2"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {titulo}
                    </p>
                    {lista.map((c) => (
                      <label
                        key={c.clave}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={consejosElegidos.includes(c.clave)}
                          onCheckedChange={(v) => alternar(c.clave, v === true)}
                          disabled={disabled}
                        />
                        {c.nombre}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="revisor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consejo que informa</FormLabel>
              <SelectConsejo
                value={field.value}
                onChange={field.onChange}
                opciones={vinculados}
                placeholder="El primer municipal vinculado"
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cotizacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable de la cotización</FormLabel>
              <SelectConsejo
                value={field.value}
                onChange={field.onChange}
                opciones={vinculados}
                placeholder="Sin responsable"
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
